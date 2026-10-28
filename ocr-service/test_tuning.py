from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from tuning import calculate_tuning


class TuningTests(unittest.TestCase):
    def test_auto_profiles_scale_conservatively(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            two = calculate_tuning(2)
            four = calculate_tuning(4)
            eight = calculate_tuning(8)
            twelve = calculate_tuning(12)
            sixteen = calculate_tuning(16)

        self.assertEqual((two.workers, two.threads_per_worker), (1, 1))
        self.assertEqual((four.workers, four.threads_per_worker), (1, 3))
        self.assertEqual((eight.workers, eight.threads_per_worker), (2, 3))
        self.assertEqual((twelve.workers, twelve.threads_per_worker), (3, 3))
        self.assertEqual((sixteen.workers, sixteen.threads_per_worker), (4, 3))

    def test_manual_overrides_are_supported(self) -> None:
        env = {
            "OCR_RESERVED_CPUS": "1",
            "OCR_WORKERS": "2",
            "OCR_CPU_THREADS": "2",
            "OCR_QUEUE_DEPTH": "7",
            "OCR_MAX_WORKERS": "4",
        }
        with patch.dict(os.environ, env, clear=True):
            tuning = calculate_tuning(8)

        self.assertEqual(tuning.reserved_cpus, 1)
        self.assertEqual(tuning.usable_cpus, 7)
        self.assertEqual(tuning.workers, 2)
        self.assertEqual(tuning.threads_per_worker, 2)
        self.assertEqual(tuning.queue_depth, 7)

    def test_reserved_cpu_never_consumes_all_capacity(self) -> None:
        with patch.dict(os.environ, {"OCR_RESERVED_CPUS": "16"}, clear=True):
            tuning = calculate_tuning(4)

        self.assertEqual(tuning.reserved_cpus, 3)
        self.assertEqual(tuning.usable_cpus, 1)
        self.assertEqual(tuning.workers, 1)


if __name__ == "__main__":
    unittest.main()
