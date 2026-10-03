-- =====================================================================
-- MIGRATION SCRIPT: SISTEM AKSES PENGELOLA/ADMIN UNTUK MURID TERTENTU
-- Jalankan script ini di Supabase Dashboard -> SQL Editor -> Run
-- SCRIPT INI AMAN: Tidak menghapus data murid, jadwal, atau laporan yang ada!
-- =====================================================================

-- 1. Buat Tabel student_access untuk mencatat izin akses murid ke admin
CREATE TABLE IF NOT EXISTS public.student_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, user_id)
);

-- Aktifkan RLS pada tabel student_access
ALTER TABLE public.student_access ENABLE ROW LEVEL SECURITY;

-- Policy untuk tabel student_access:
-- Pemilik murid ATAU admin yang diberi akses bisa membaca data perizinan
DROP POLICY IF EXISTS "Users can view student_access" ON public.student_access;
CREATE POLICY "Users can view student_access" ON public.student_access
    FOR SELECT TO authenticated
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = student_access.student_id 
            AND students.user_id = auth.uid()
        )
    );

-- Pemilik murid bisa menambah atau mencabut izin akses untuk muridnya
DROP POLICY IF EXISTS "Owners can manage student_access" ON public.student_access;
CREATE POLICY "Owners can manage student_access" ON public.student_access
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = student_access.student_id 
            AND students.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = student_access.student_id 
            AND students.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 2. UPDATE POLICY PADA TABEL STUDENTS
-- Agar Admin yang diberikan izin di student_access bisa melihat & mengelola murid tersebut
-- =====================================================================

DROP POLICY IF EXISTS "Users can perform all actions on their own students" ON public.students;
CREATE POLICY "Users can perform all actions on their own students" 
    ON public.students FOR ALL TO authenticated 
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.student_access 
            WHERE student_access.student_id = students.id 
            AND student_access.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.student_access 
            WHERE student_access.student_id = students.id 
            AND student_access.user_id = auth.uid()
        )
    );

-- =====================================================================
-- 3. UPDATE POLICY PADA TABEL REPORTS
-- Agar Admin bisa melihat dan membuat laporan untuk murid yang diizinkan
-- dan Pemilik Murid tetap bisa melihat semua laporan muridnya
-- =====================================================================

DROP POLICY IF EXISTS "Users can perform all actions on their own reports" ON public.reports;
CREATE POLICY "Users can perform all actions on their own reports" 
    ON public.reports FOR ALL TO authenticated 
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = reports.student_id 
            AND (
                students.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.student_access 
                    WHERE student_access.student_id = students.id 
                    AND student_access.user_id = auth.uid()
                )
            )
        )
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = reports.student_id 
            AND (
                students.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.student_access 
                    WHERE student_access.student_id = students.id 
                    AND student_access.user_id = auth.uid()
                )
            )
        )
    );

-- =====================================================================
-- 4. UPDATE POLICY PADA TABEL SCHEDULES & SCHEDULE_STUDENT
-- Agar Jadwal yang mencakup murid terizinkan juga bisa diakses oleh admin
-- =====================================================================

DROP POLICY IF EXISTS "Users can perform all actions on their own schedules" ON public.schedules;
CREATE POLICY "Users can perform all actions on their own schedules" 
    ON public.schedules FOR ALL TO authenticated 
    USING (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.schedule_student
            JOIN public.student_access ON student_access.student_id = schedule_student.student_id
            WHERE schedule_student.schedule_id = schedules.id
            AND student_access.user_id = auth.uid()
        )
    )
    WITH CHECK (
        auth.uid() = user_id 
        OR EXISTS (
            SELECT 1 FROM public.schedule_student
            JOIN public.student_access ON student_access.student_id = schedule_student.student_id
            WHERE schedule_student.schedule_id = schedules.id
            AND student_access.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can perform all actions on their own schedule_student relations" ON public.schedule_student;
CREATE POLICY "Users can perform all actions on their own schedule_student relations" 
    ON public.schedule_student FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = schedule_student.student_id 
            AND (
                students.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.student_access 
                    WHERE student_access.student_id = students.id 
                    AND student_access.user_id = auth.uid()
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = schedule_student.student_id 
            AND (
                students.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.student_access 
                    WHERE student_access.student_id = students.id 
                    AND student_access.user_id = auth.uid()
                )
            )
        )
    );

-- =====================================================================
-- 5. UPDATE POLICY PADA PENDING_REPORTS
-- =====================================================================

DROP POLICY IF EXISTS "Users can perform all actions on their own pending_reports" ON public.pending_reports;
CREATE POLICY "Users can perform all actions on their own pending_reports" 
    ON public.pending_reports FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = pending_reports.student_id 
            AND (
                students.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.student_access 
                    WHERE student_access.student_id = students.id 
                    AND student_access.user_id = auth.uid()
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.students 
            WHERE students.id = pending_reports.student_id 
            AND (
                students.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.student_access 
                    WHERE student_access.student_id = students.id 
                    AND student_access.user_id = auth.uid()
                )
            )
        )
    );

-- =====================================================================
-- 6. BERIKAN AKSES REKOMENDASI DATASET KE SELURUH PENGGUNA TERDAFTAR
-- Agar Admin juga bisa membaca preset kategori/materi untuk AI Generator
-- =====================================================================

DROP POLICY IF EXISTS "Users can read recommendation_datasets" ON public.recommendation_datasets;
CREATE POLICY "Users can read recommendation_datasets" 
    ON public.recommendation_datasets FOR SELECT TO authenticated 
    USING (true);

DROP POLICY IF EXISTS "Users can read dataset_entries" ON public.dataset_entries;
CREATE POLICY "Users can read dataset_entries" 
    ON public.dataset_entries FOR SELECT TO authenticated 
    USING (true);

-- =====================================================================
-- 7. CONTOH: CARA MEMBERIKAN AKSES MURID KE AKUN ADMIN INI
-- UUID Admin Anda: '8ffc29b2-f0d1-456b-8a2a-049b89a63712'
-- =====================================================================

-- Contoh A: Jika ingin memberikan akses untuk SATU murid tertentu (ganti 'Nama Murid'):
-- INSERT INTO public.student_access (student_id, user_id)
-- SELECT id, '8ffc29b2-f0d1-456b-8a2a-049b89a63712'::uuid
-- FROM public.students 
-- WHERE name ILIKE '%Nama Murid%'
-- ON CONFLICT (student_id, user_id) DO NOTHING;

-- Contoh B: Jika ingin memberikan akses untuk SEMUA murid ke admin ini:
-- INSERT INTO public.student_access (student_id, user_id)
-- SELECT id, '8ffc29b2-f0d1-456b-8a2a-049b89a63712'::uuid
-- FROM public.students
-- ON CONFLICT (student_id, user_id) DO NOTHING;

-- Contoh C: Menghapus / mencabut kembali akses murid dari admin:
-- DELETE FROM public.student_access 
-- WHERE user_id = '8ffc29b2-f0d1-456b-8a2a-049b89a63712'::uuid 
-- AND student_id = (SELECT id FROM public.students WHERE name ILIKE '%Nama Murid%');

