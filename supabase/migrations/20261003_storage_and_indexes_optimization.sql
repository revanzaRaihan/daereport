-- =====================================================================
-- MIGRATION: Storage Policies & Performance Indexes Optimization
-- =====================================================================

-- 1. INDEX OPTIMIZATIONS
CREATE INDEX IF NOT EXISTS idx_schedule_student_schedule_id ON public.schedule_student (schedule_id);
CREATE INDEX IF NOT EXISTS idx_schedule_student_student_id ON public.schedule_student (student_id);
CREATE INDEX IF NOT EXISTS idx_dataset_entries_user_id ON public.dataset_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_datasets_user_id ON public.recommendation_datasets (user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id_date ON public.reports (user_id, report_date DESC);

-- 2. STORAGE POLICIES FOR BUCKET 'reports'
-- Enable delete and update for authenticated users so image removal on report delete succeeds
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated deletes on reports'
    ) THEN
        CREATE POLICY "Allow authenticated deletes on reports" 
            ON storage.objects FOR DELETE TO authenticated 
            USING (bucket_id = 'reports');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated updates on reports'
    ) THEN
        CREATE POLICY "Allow authenticated updates on reports" 
            ON storage.objects FOR UPDATE TO authenticated 
            USING (bucket_id = 'reports') 
            WITH CHECK (bucket_id = 'reports');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public select on reports'
    ) THEN
        CREATE POLICY "Allow public select on reports" 
            ON storage.objects FOR SELECT TO public 
            USING (bucket_id = 'reports');
    END IF;
END $$;
