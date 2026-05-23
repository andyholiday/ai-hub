-- Make api_endpoint nullable so admins can clear a custom endpoint back to default.
ALTER TABLE public.ai_providers ALTER COLUMN api_endpoint DROP NOT NULL;
