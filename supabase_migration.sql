-- =====================================================================
-- MIGRATION SCRIPT: INTEGRASI SUPABASE AUTH & MIGRASI DATA LAMA
-- Jalankan script ini di Supabase Dashboard -> SQL Editor
-- =====================================================================

-- LANGKAH A: DAPATKAN UUID USER SUPABASE BARU ANDA
-- 1. Silakan buat akun/daftar di Supabase Auth (bisa lewat dashboard atau saat login nanti).
-- 2. Dapatkan UUID user baru tersebut dari tabel auth.users.
-- 3. Ganti placeholder 'GANTI-DENGAN-UUID-USER-SUPABASE-ANDA' di bawah dengan UUID tersebut.

-- Hapus policy lama terlebih dahulu agar tipe kolom user_id bisa dimodifikasi
DROP POLICY IF EXISTS "Users can perform all actions on their own students" ON public.students;
DROP POLICY IF EXISTS "Users can perform all actions on their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can perform all actions on their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can perform all actions on their own dataset_entries" ON public.dataset_entries;
DROP POLICY IF EXISTS "Users can perform all actions on their own recommendation_datasets" ON public.recommendation_datasets;
DROP POLICY IF EXISTS "Users can perform all actions on their own pending_reports" ON public.pending_reports;

DO $$
DECLARE
    -- !!! SILAKAN GANTI NILAI DI BAWAH INI DENGAN UUID DARI auth.users !!!
    new_user_uuid UUID := '1694334c-1ece-4f93-a2c9-51a9228f654b';
    old_user_id INT := 1; -- ID user default dari Laravel (biasanya 1)
BEGIN

    -- 1. Hapus Foreign Key Constraints yang mengikat ke tabel public.users lama & baru jika ada
    ALTER TABLE IF EXISTS public.students DROP CONSTRAINT IF EXISTS students_user_id_foreign;
    ALTER TABLE IF EXISTS public.students DROP CONSTRAINT IF EXISTS students_user_id_fkey;
    ALTER TABLE IF EXISTS public.reports DROP CONSTRAINT IF EXISTS reports_user_id_foreign;
    ALTER TABLE IF EXISTS public.reports DROP CONSTRAINT IF EXISTS reports_user_id_fkey;
    ALTER TABLE IF EXISTS public.schedules DROP CONSTRAINT IF EXISTS schedules_user_id_foreign;
    ALTER TABLE IF EXISTS public.schedules DROP CONSTRAINT IF EXISTS schedules_user_id_fkey;
    ALTER TABLE IF EXISTS public.dataset_entries DROP CONSTRAINT IF EXISTS dataset_entries_user_id_foreign;
    ALTER TABLE IF EXISTS public.dataset_entries DROP CONSTRAINT IF EXISTS dataset_entries_user_id_fkey;
    ALTER TABLE IF EXISTS public.recommendation_datasets DROP CONSTRAINT IF EXISTS recommendation_datasets_user_id_foreign;
    ALTER TABLE IF EXISTS public.recommendation_datasets DROP CONSTRAINT IF EXISTS recommendation_datasets_user_id_fkey;

    -- 2. Ubah tipe data kolom user_id menjadi VARCHAR sementara untuk memudahkan migrasi
    ALTER TABLE public.students ALTER COLUMN user_id TYPE VARCHAR(255);
    ALTER TABLE public.reports ALTER COLUMN user_id TYPE VARCHAR(255);
    ALTER TABLE public.schedules ALTER COLUMN user_id TYPE VARCHAR(255);
    ALTER TABLE public.dataset_entries ALTER COLUMN user_id TYPE VARCHAR(255);
    ALTER TABLE public.recommendation_datasets ALTER COLUMN user_id TYPE VARCHAR(255);

    -- 3. Update data user_id lama (integer) menjadi UUID baru
    UPDATE public.students SET user_id = new_user_uuid::text WHERE user_id = old_user_id::text OR user_id IS NULL;
    UPDATE public.reports SET user_id = new_user_uuid::text WHERE user_id = old_user_id::text OR user_id IS NULL;
    UPDATE public.schedules SET user_id = new_user_uuid::text WHERE user_id = old_user_id::text OR user_id IS NULL;
    UPDATE public.dataset_entries SET user_id = new_user_uuid::text WHERE user_id = old_user_id::text OR user_id IS NULL;
    UPDATE public.recommendation_datasets SET user_id = new_user_uuid::text WHERE user_id = old_user_id::text OR user_id IS NULL;

    -- 4. Ubah tipe data kolom user_id menjadi UUID secara resmi
    ALTER TABLE public.students ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    ALTER TABLE public.reports ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    ALTER TABLE public.schedules ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    ALTER TABLE public.dataset_entries ALTER COLUMN user_id TYPE UUID USING user_id::uuid;
    ALTER TABLE public.recommendation_datasets ALTER COLUMN user_id TYPE UUID USING user_id::uuid;

    -- 5. Tambahkan Foreign Key Constraints ke tabel auth.users bawaan Supabase
    ALTER TABLE public.students ADD CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.reports ADD CONSTRAINT reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.schedules ADD CONSTRAINT schedules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.dataset_entries ADD CONSTRAINT dataset_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    ALTER TABLE public.recommendation_datasets ADD CONSTRAINT recommendation_datasets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

    RAISE NOTICE 'Migrasi kolom user_id ke Supabase Auth selesai dengan sukses!';
END $$;

-- =====================================================================
-- LANGKAH B: SETUP ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Aktifkan RLS pada seluruh tabel jika belum aktif
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_reports ENABLE ROW LEVEL SECURITY;

-- Drop Policy lama jika ada
DROP POLICY IF EXISTS "Users can perform all actions on their own students" ON public.students;
DROP POLICY IF EXISTS "Users can perform all actions on their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can perform all actions on their own schedules" ON public.schedules;
DROP POLICY IF EXISTS "Users can perform all actions on their own dataset_entries" ON public.dataset_entries;
DROP POLICY IF EXISTS "Users can perform all actions on their own recommendation_datasets" ON public.recommendation_datasets;
DROP POLICY IF EXISTS "Users can perform all actions on their own pending_reports" ON public.pending_reports;

-- Buat Policy Baru berdasarkan auth.uid()
CREATE POLICY "Users can perform all actions on their own students" 
    ON public.students FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can perform all actions on their own reports" 
    ON public.reports FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can perform all actions on their own schedules" 
    ON public.schedules FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can perform all actions on their own dataset_entries" 
    ON public.dataset_entries FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can perform all actions on their own recommendation_datasets" 
    ON public.recommendation_datasets FOR ALL TO authenticated 
    USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Untuk pending_reports, ia berelasi ke student_id yang dimiliki oleh user
CREATE POLICY "Users can perform all actions on their own pending_reports" 
    ON public.pending_reports FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = pending_reports.student_id 
            AND students.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = pending_reports.student_id 
            AND students.user_id = auth.uid()
        )
    );
