#!/usr/bin/env python3
"""Detect broad solid-black bands in rendered synthetic PDF templates.

Poppler is already installed by the pdf-mapping-visual job; stdlib only.
This is a deterministic regression guard, not a replacement for visual QA.
"""
from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory

root = Path(__file__).resolve().parents[2]
pdfs = [
    root / "docs/_pdf_test_previews/termo-responsabilidade-er/synthetic.pdf",
    root / "docs/_pdf_test_previews/declaracao-extravio-aquaviario/synthetic.pdf",
    root / "docs/_pdf_test_previews/declaracao-residencia-aquaviario/synthetic.pdf",
]

for pdf in pdfs:
    if not pdf.is_file():
        raise SystemExit(f"Missing QA sample: {pdf}")
    with TemporaryDirectory(prefix="pdf-visual-check-") as directory:
        path = Path(directory) / "render"
        run(["pdftoppm", "-f", "1", "-l", "1", "-r", "72", "-gray",
             "-singlefile", str(pdf), str(path)], check=True)
        data = path.with_suffix(".pgm").read_bytes()
    header = data.split(b"\n", 3)
    if len(header) != 4 or header[0] != b"P5" or header[2] != b"255":
        raise SystemExit(f"Unexpected Poppler PGM header: {pdf}")
    width, height = (int(v) for v in header[1].split())
    pixels = header[3]
    if len(pixels) != width * height:
        raise SystemExit(f"Unexpected raster dimensions: {pdf}")
    near_black = sum(v < 48 for v in pixels) / len(pixels)
    streak = max_streak = 0
    for y in range(height):
        row = pixels[y * width:(y + 1) * width]
        dark_fraction = sum(v < 48 for v in row) / width
        streak = streak + 1 if dark_fraction > 0.50 else 0
        max_streak = max(max_streak, streak)
    print(f"{pdf.parent.name}: near_black={near_black:.3f}, black_band={max_streak}")
    if near_black > 0.10 or max_streak >= 20:
        raise SystemExit(f"Potential large black area in generated template: {pdf}")
