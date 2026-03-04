-- Migration 010: Support attachments storage bucket
-- Creates a public bucket for support ticket file attachments (images, videos)
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'support-attachments',
        'support-attachments',
        true,
        10485760,
        -- 10 MB per file
        ARRAY [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'
  ]
    ) ON CONFLICT (id) DO NOTHING;
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload support attachments" ON storage.objects FOR
INSERT TO authenticated WITH CHECK (
        bucket_id = 'support-attachments'
        AND (storage.foldername(name)) [1] = auth.uid()::text
    );
-- Allow public read (so images render in browser)
CREATE POLICY "Support attachments are publicly readable" ON storage.objects FOR
SELECT TO public USING (bucket_id = 'support-attachments');
-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own support attachments" ON storage.objects FOR DELETE TO authenticated USING (
    bucket_id = 'support-attachments'
    AND (storage.foldername(name)) [1] = auth.uid()::text
);