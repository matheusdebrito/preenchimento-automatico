-- Charge credits when OpenAI analysis is dispatched, not when PDFs are generated.
ALTER TABLE job_credit_receipts
  DROP CONSTRAINT IF EXISTS job_credit_receipts_state_check;

ALTER TABLE job_credit_receipts
  ADD CONSTRAINT job_credit_receipts_state_check
  CHECK (state IN ('charged', 'delivered', 'refunded', 'consumed'));
