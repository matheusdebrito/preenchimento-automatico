FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PADDLE_PDX_MODEL_SOURCE=BOS \
    OMP_NUM_THREADS=4

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libglib2.0-0 libgl1 libgomp1 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py ./

# Download the official models during the image build so document bytes are never
# required to trigger a network download at runtime.
RUN python -c "from paddleocr import PaddleOCR; PaddleOCR(lang='pt', ocr_version='PP-OCRv6', use_doc_orientation_classify=True, use_doc_unwarping=False, use_textline_orientation=True, device='cpu', cpu_threads=4)"

EXPOSE 8000
CMD ["python", "/app/app.py"]
