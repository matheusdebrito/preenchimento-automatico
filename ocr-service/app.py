from __future__ import annotations

import json
import os
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

# Keep CPU inference on the conservative path. These must be set before
# importing Paddle/PaddleOCR so the native runtime sees them during init.
os.environ.setdefault("OMP_NUM_THREADS", "1")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "1")
os.environ.setdefault("MKL_NUM_THREADS", "1")
os.environ.setdefault("FLAGS_use_mkldnn", "0")

from paddleocr import PaddleOCR

MAX_BODY = 10 * 1024 * 1024
MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
}

ocr = PaddleOCR(
    lang="pt",
    ocr_version="PP-OCRv6",
    use_doc_orientation_classify=True,
    use_doc_unwarping=False,
    use_textline_orientation=True,
    device="cpu",
    enable_mkldnn=False,
    cpu_threads=max(1, int(os.getenv("OCR_CPU_THREADS", "1"))),
)

# Paddle's predictor is not safe to execute concurrently in this CPU runtime.
# The HTTP server may handle health checks concurrently, but inference itself
# is serialized to one request at a time.
OCR_LOCK = threading.Lock()


def builtin(value: Any) -> Any:
    if hasattr(value, "tolist"):
        return value.tolist()
    if isinstance(value, dict):
        return {str(key): builtin(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [builtin(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return str(value)


def normalize_result(result: Any, index: int) -> dict[str, Any]:
    raw = getattr(result, "json", {})
    if callable(raw):
        raw = raw()
    raw = builtin(raw)
    payload = raw.get("res", raw) if isinstance(raw, dict) else {}
    texts = payload.get("rec_texts", []) if isinstance(payload, dict) else []
    scores = payload.get("rec_scores", []) if isinstance(payload, dict) else []
    boxes = payload.get("rec_boxes", []) if isinstance(payload, dict) else []
    polys = payload.get("rec_polys", []) if isinstance(payload, dict) else []

    lines: list[dict[str, Any]] = []
    for position, text in enumerate(texts):
        value = str(text).strip()
        if not value:
            continue
        score = float(scores[position]) if position < len(scores) else 0.0
        box = boxes[position] if position < len(boxes) else None
        poly = polys[position] if position < len(polys) else None
        lines.append({
            "text": value[:500],
            "confidence": max(0.0, min(1.0, score)),
            "box": builtin(box),
            "polygon": builtin(poly),
        })

    preprocessing = payload.get("doc_preprocessor_res", {}) if isinstance(payload, dict) else {}
    orientation = preprocessing.get("angle") if isinstance(preprocessing, dict) else None
    return {
        "page": index,
        "orientation": orientation if isinstance(orientation, (int, float)) else None,
        "lines": lines,
    }


class Handler(BaseHTTPRequestHandler):
    server_version = "paddle-ocr-internal/1"

    def log_message(self, _format: str, *_args: Any) -> None:
        # Never put OCR text, document paths or request bodies in logs.
        return

    def send_json(self, status: int, data: dict[str, Any]) -> None:
        payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_json(404, {"error": "not_found"})
            return
        self.send_json(200, {"status": "ok", "engine": "paddleocr", "version": "3.7.0", "model": "PP-OCRv6"})

    def do_POST(self) -> None:
        if self.path != "/ocr":
            self.send_json(404, {"error": "not_found"})
            return
        content_type = (self.headers.get("Content-Type") or "").split(";", 1)[0].strip().lower()
        extension = MIME_EXTENSIONS.get(content_type)
        try:
            length = int(self.headers.get("Content-Length") or "0")
        except ValueError:
            length = 0
        if extension is None or length < 1 or length > MAX_BODY:
            self.send_json(415 if extension is None else 413, {"error": "invalid_document"})
            return

        body = self.rfile.read(length)
        if len(body) != length:
            self.send_json(400, {"error": "truncated_document"})
            return

        started = time.monotonic()
        path: str | None = None
        try:
            with tempfile.NamedTemporaryFile(prefix="paddle-", suffix=extension, delete=False) as handle:
                handle.write(body)
                path = handle.name
            with OCR_LOCK:
                predictions = list(ocr.predict(path))
            pages = [normalize_result(result, index) for index, result in enumerate(predictions)]
            self.send_json(200, {
                "engine": "paddleocr",
                "version": "3.7.0",
                "model": "PP-OCRv6",
                "elapsedMs": int((time.monotonic() - started) * 1000),
                "pages": pages,
            })
        except Exception as exc:
            # Internal-only service: expose only exception class/message for operational
            # diagnosis. Never include OCR text, request bytes, headers or file paths.
            detail = f"{type(exc).__name__}: {str(exc)}".replace("\n", " ")[:300]
            self.send_json(500, {"error": "ocr_failed", "detail": detail})
        finally:
            if path:
                try:
                    Path(path).unlink(missing_ok=True)
                except OSError:
                    pass


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    server.serve_forever()
