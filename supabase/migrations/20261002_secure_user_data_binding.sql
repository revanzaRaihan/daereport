-- =====================================================================
-- MIGRATION: SECURE DATA BINDING EXCLUSIVELY TO admin@institution.com
-- =====================================================================
-- This script fixes the RLS data leak where any authenticated account
-- could see all students because of "TO anon, authenticated USING (true)".
--
-- SCRIPT INI AMAN:
-- 1. Tidak menghapus (DROP) tabel atau kolom apapun.
-- 2. Mengikat kepemilikan 62 murid dan 542 laporan ke admin@institution.com.
-- 3. Akun email lain yang login otomatis mendapatkan 0 murid dan 0 laporan.
-- 4. Portal orang tua (/p/[slug]) tetap bisa membaca via anon role.
-- =====================================================================

-- LANGKAH 1: SINKRONISASI USER_ID KE AKUN admin@institution.com
DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Ambil UUID akun auth yang memiliki email admin@institution.com
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE LOWER(email) = 'admin@institution.com' 
    ORDER BY created_at ASC 
    LIMIT 1;

    IF target_user_id IS NOT NULL THEN
        UPDATE public.students 
        SET user_id = target_user_id 
        WHERE user_id = '1694334c-1ece-4f93-a2c9-51a9228f654b' OR user_id IS NULL;

        UPDATE public.reports 
        SET user_id = target_user_id 
        WHERE user_id = '1694334c-1ece-4f93-a2c9-51a9228f654b' OR user_id IS NULL;

        UPDATE public.schedules 
        SET user_id = target_user_id 
        WHERE user_id = '1694334c-1ece-4f93-a2c9-51a9228f654b' OR user_id IS NULL;

        UPDATE public.feedbacks 
        SET user_id = target_user_id 
        WHERE user_id = '1694334c-1ece-4f93-a2c9-51a9228f654b' OR user_id IS NULL;

        RAISE NOTICE 'Sinkronisasi berhasil ke target_user_id: %', target_user_id;
    ELSE
        RAISE NOTICE 'Akun admin@institution.com belum ditemukan di auth.users. Data tetap aman.';
    END IF;
END $$;

-- =====================================================================
-- LANGKAH 2: PERBAIKI RLS POLICY PADA TABEL STUDENTS
-- =====================================================================

DROP POLICY IF EXISTS "Allow anonymous read on students" ON public.students;
DROP POLICY IF EXISTS "Users can perform all actions on their own students" ON public.students;

-- Hanya role anon (publik / portal orang tua /p/[slug]) yang boleh baca tanpa auth
CREATE POLICY "Allow anonymous read on students" 
    ON public.students FOR SELECT TO anon 
    USING (true);

-- Pengguna yang login HANYA bisa melihat & mengelola murid miliknya sendiri:
CREATE POLICY "Users can perform all actions on their own students" 
    ON public.students FOR ALL TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- LANGKAH 3: PERBAIKI RLS POLICY PADA TABEL REPORTS
-- =====================================================================

DROP POLICY IF EXISTS "Allow anonymous read on reports" ON public.reports;
DROP POLICY IF EXISTS "Users can perform all actions on their own reports" ON public.reports;

-- Hanya role anon (portal orang tua /p/[slug]) yang boleh baca tanpa auth
CREATE POLICY "Allow anonymous read on reports" 
    ON public.reports FOR SELECT TO anon 
    USING (true);

-- Pengguna yang login HANYA bisa melihat & mengelola laporan miliknya sendiri:
CREATE POLICY "Users can perform all actions on their own reports" 
    ON public.reports FOR ALL TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- LANGKAH 4: PERBAIKI RLS POLICY PADA TABEL FEEDBACKS & SCHEDULES
-- =====================================================================

DROP POLICY IF EXISTS "Users can view their own feedbacks" ON public.feedbacks;
CREATE POLICY "Users can view their own feedbacks" 
    ON public.feedbacks FOR SELECT TO authenticated 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can perform all actions on their own schedules" ON public.schedules;
CREATE POLICY "Users can perform all actions on their own schedules" 
    ON public.schedules FOR ALL TO authenticated 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
