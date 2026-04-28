-- Add branding columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS brand_color TEXT,
  ADD COLUMN IF NOT EXISTS brand_avatar TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Create public bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Company logos are publicly viewable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'company-logos');

-- Authenticated users can upload to their own folder (user_id/...)
CREATE POLICY "Users can upload their company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'company-logos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);