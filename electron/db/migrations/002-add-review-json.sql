-- Spec 014: persist the latest Sol review on each job run.
ALTER TABLE job_runs ADD COLUMN review_json TEXT;
