from __future__ import annotations

import json
import os
import queue
import tempfile
import threading
import time
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

from tuning import calculate_tuning

MAX_BODY = 10 * 1024 * 1024
MIME_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "application/pdf": ".pdf",
}

TUNING = calculate_tuning()

# Native math runtimes must see these values before Paddle/PaddleOCR is imported.
# The values are calculated from the CPUs effectively available to this container.
os.environ["OMP_NUM_THREADS"] = str(TUNING.threads_per_worker)
os.environ["OPENBLAS_NUM_THREADS"] = str(TUNING.threads_per_worker)
os.environ["MKL_NUM_THREADS"] = str(TUNING.threads_per_worker)
os.environ.setdefault("FLAGS_use_mkldnn", "0")

from paddleocr import PaddleOCR


def create_predictor() -> PaddleOCR:
    return PaddleOCR(
        lang="pt",
        ocr_version="PP-OCRv6",
        use_doc_orientation_classify=True,
        use_doc_unwarping=False,
        use_textline_orientation=True,
        device="cpu",
        enable_mkldnn=False,
        cpu_threads=TUNING.threads_per_worker,
    )


# Each Paddle predictor is used by only one request at a time. This replaces the
# previous global lock while avoiding concurrent calls into the same predictor.
OCR_POOL: queue.Queue[PaddleOCR] = queue.Queue(maxsize=TUNING.workers)
for _ in range(TUNING.workers):
    OCR_POOL.put(create_predictor())

# Bound both active and waiting OCR requests. This prevents a traffic spike from
# creating an unbounded number of HTTP threads holding document bytes in memory.
OCR_SLOTS = threading.BoundedSemaphore(TUNING.workers + TUNING.queue_depth)


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
    server_version = "paddle-ocr-internal/2"

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
        self.send_json(200, {
            "status": "ok",
            "engine": "paddleocr",
            "version": "3.7.0",
            "model": "PP-OCRv6",
            "capacity": {
                "availableCpus": TUNING.available_cpus,
                "reservedCpus": TUNING.reserved_cpus,
                "usableCpus": TUNING.usable_cpus,
                "workers": TUNING.workers,
                "threadsPerWorker": TUNING.threads_per_worker,
                "queueDepth": TUNING.queue_depth,
            },
        })

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

        if not OCR_SLOTS.acquire(blocking=False):
            self.send_json(HTTPStatus.TOO_MANY_REQUESTS, {"error": "ocr_busy"})
            return

        body: bytes | None = None
        path: str | None = None
        predictor: PaddleOCR | None = None
        started = time.monotonic()
        try:
            body = self.rfile.read(length)
            if len(body) != length:
                self.send_json(400, {"error": "truncated_document"})
                return

            with tempfile.NamedTemporaryFile(prefix="paddle-", suffix=extension, delete=False) as handle:
                handle.write(body)
                path = handle.name
            # Release request bytes before inference; the temporary file is the source.
            body = None

            predictor = OCR_POOL.get()
            predictions = list(predictor.predict(path))
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
            if predictor is not None:
                OCR_POOL.put(predictor)
            if path:
                try:
                    Path(path).unlink(missing_ok=True)
                except OSError:
                    pass
            OCR_SLOTS.release()


if __name__ == "__main__":
    print("[OCR_CAPACITY]", json.dumps({
        "availableCpus": TUNING.available_cpus,
        "reservedCpus": TUNING.reserved_cpus,
        "usableCpus": TUNING.usable_cpus,
        "workers": TUNING.workers,
        "threadsPerWorker": TUNING.threads_per_worker,
        "queueDepth": TUNING.queue_depth,
    }, separators=(",", ":")), flush=True)
    server = ThreadingHTTPServer(("0.0.0.0", 8000), Handler)
    server.serve_forever()
