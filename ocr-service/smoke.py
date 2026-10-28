from __future__ import annotations

import json
import urllib.request
from pathlib import Path

with urllib.request.urlopen("http://127.0.0.1:8000/health", timeout=5) as health_response:
    health = json.load(health_response)

capacity = health.get("capacity", {})
assert health.get("status") == "ok"
assert int(capacity.get("availableCpus", 0)) >= 1
assert int(capacity.get("workers", 0)) >= 1
assert int(capacity.get("threadsPerWorker", 0)) >= 1
assert int(capacity.get("queueDepth", 0)) >= 1

path = Path("/app/fixtures/identity-synthetic.png")
body = path.read_bytes()
request = urllib.request.Request(
    "http://127.0.0.1:8000/ocr",
    data=body,
    headers={"Content-Type": "image/png", "Content-Length": str(len(body))},
    method="POST",
)
def run_once() -> dict:
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)
    except Exception as exc:
        if hasattr(exc, "read"):
            print("[PADDLE_OCR_SMOKE_ERROR]", exc.read().decode("utf-8", "replace"))
        raise

# Execute twice in the same long-lived service process. This catches the
# native-runtime failure where the first prediction works and later ones fail.
result = run_once()
second = run_once()

texts = [
    str(line.get("text", ""))
    for page in result.get("pages", [])
    for line in page.get("lines", [])
]
joined = " ".join(texts).upper()
assert result.get("engine") == "paddleocr"
assert result.get("model") == "PP-OCRv6"
assert second.get("engine") == "paddleocr"
assert second.get("model") == "PP-OCRv6"
assert "MARIA" in joined and "SOUZA" in joined
assert "123.456.789-09" in joined
print("[PADDLE_OCR_SMOKE]", json.dumps({
    "engine": result.get("engine"),
    "model": result.get("model"),
    "lineCount": len(texts),
    "nameTokensFound": True,
    "cpfFound": True,
    "repeatInferencePassed": True,
    "workers": capacity.get("workers"),
    "threadsPerWorker": capacity.get("threadsPerWorker"),
}, ensure_ascii=False))
