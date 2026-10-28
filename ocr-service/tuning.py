from __future__ import annotations

import math
import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class OcrTuning:
    available_cpus: int
    reserved_cpus: int
    usable_cpus: int
    workers: int
    threads_per_worker: int
    queue_depth: int


def _read_text(path: str) -> str | None:
    try:
        return Path(path).read_text(encoding="utf-8").strip()
    except OSError:
        return None


def _affinity_cpu_count() -> int:
    try:
        return max(1, len(os.sched_getaffinity(0)))
    except (AttributeError, OSError):
        return max(1, os.cpu_count() or 1)


def _cgroup_cpu_quota() -> int | None:
    # cgroup v2
    value = _read_text("/sys/fs/cgroup/cpu.max")
    if value:
        parts = value.split()
        if len(parts) == 2 and parts[0] != "max":
            try:
                quota = int(parts[0])
                period = int(parts[1])
                if quota > 0 and period > 0:
                    return max(1, math.floor(quota / period))
            except ValueError:
                pass

    # cgroup v1
    quota_raw = _read_text("/sys/fs/cgroup/cpu/cpu.cfs_quota_us")
    period_raw = _read_text("/sys/fs/cgroup/cpu/cpu.cfs_period_us")
    if quota_raw and period_raw:
        try:
            quota = int(quota_raw)
            period = int(period_raw)
            if quota > 0 and period > 0:
                return max(1, math.floor(quota / period))
        except ValueError:
            pass
    return None


def effective_cpu_count() -> int:
    affinity = _affinity_cpu_count()
    quota = _cgroup_cpu_quota()
    return min(affinity, quota) if quota else affinity


def _env_int(name: str, default: int, minimum: int = 1, maximum: int = 64) -> int:
    raw = os.getenv(name, "").strip().lower()
    if not raw or raw == "auto":
        return default
    try:
        value = int(raw)
    except ValueError as exc:
        raise ValueError(f"{name} deve ser 'auto' ou inteiro.") from exc
    if value < minimum or value > maximum:
        raise ValueError(f"{name} deve estar entre {minimum} e {maximum}.")
    return value


def calculate_tuning(available_cpus: int | None = None) -> OcrTuning:
    cpus = max(1, available_cpus or effective_cpu_count())

    auto_reserved = 1 if cpus <= 4 else 2
    reserved = _env_int("OCR_RESERVED_CPUS", auto_reserved, minimum=0, maximum=16)
    reserved = min(reserved, max(0, cpus - 1))
    usable = max(1, cpus - reserved)

    max_workers = _env_int("OCR_MAX_WORKERS", 4, minimum=1, maximum=16)
    auto_workers = max(1, min(max_workers, usable // 3 if usable >= 3 else 1))
    workers = _env_int("OCR_WORKERS", auto_workers, minimum=1, maximum=16)

    auto_threads = max(1, min(4, usable // max(1, workers)))
    threads = _env_int("OCR_CPU_THREADS", auto_threads, minimum=1, maximum=16)

    auto_queue = max(4, workers * 3)
    queue_depth = _env_int("OCR_QUEUE_DEPTH", auto_queue, minimum=1, maximum=128)

    return OcrTuning(
        available_cpus=cpus,
        reserved_cpus=reserved,
        usable_cpus=usable,
        workers=workers,
        threads_per_worker=threads,
        queue_depth=queue_depth,
    )
