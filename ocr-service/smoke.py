from __future__ import annotations

import json
import urllib.request
from pathlib import Path

path = Path("/app/fixtures/identity-synthetic.png")
body = path.read_bytes()
request = urllib.request.Request(
    "http://127.0.0.1:8000/ocr",
    data=body,
    headers={"Content-Type": "image/png", "Content-Length": str(len(body))},
    method="POST",
)
try:
    with urllib.request.urlopen(request, timeout=60) as response:
        result = json.load(response)
except Exception as exc:
    if hasattr(exc, "read"):
        print("[PADDLE_OCR_SMOKE_ERROR]", exc.read().decode("utf-8", "replace"))
    raise

texts = [
    str(line.get("text", ""))
    for page in result.get("pages", [])
    for line in page.get("lines", [])
]
joined = " ".join(texts).upper()
assert result.get("engine") == "paddleocr"
assert result.get("model") == "PP-OCRv6"
assert "MARIA" in joined and "SOUZA" in joined
assert "123.456.789-09" in joined
print("[PADDLE_OCR_SMOKE]", json.dumps({
    "engine": result.get("engine"),
    "model": result.get("model"),
    "lineCount": len(texts),
    "nameTokensFound": True,
    "cpfFound": True,
}, ensure_ascii=False))
