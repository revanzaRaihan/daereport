-- =====================================================================
-- MIGRATION: ADD ADMIN ROLE AND CONFIGURE ADMIN RLS ACCESS
-- =====================================================================
-- Memberikan akses penuh bagi pengguna dengan role admin
-- untuk melihat dan memodifikasi semua data di sistem, sementara
-- akun guru tetap terisolasi hanya pada data miliknya sendiri.
-- =====================================================================

-- 1. Helper function untuk mendeteksi apakah caller adalah admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
      false
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- 2. Kebijakan RLS Tabel STUDENTS
DROP POLICY IF EXISTS "Users can perform all actions on their own students" ON public.students;
CREATE POLICY "Users can perform all actions on their own students" 
    ON public.students FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 3. Kebijakan RLS Tabel REPORTS
DROP POLICY IF EXISTS "Users can perform all actions on their own reports" ON public.reports;
CREATE POLICY "Users can perform all actions on their own reports" 
    ON public.reports FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 4. Kebijakan RLS Tabel SCHEDULES
DROP POLICY IF EXISTS "Users can perform all actions on their own schedules" ON public.schedules;
CREATE POLICY "Users can perform all actions on their own schedules" 
    ON public.schedules FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 5. Kebijakan RLS Tabel FEEDBACKS
DROP POLICY IF EXISTS "Users can view their own feedbacks" ON public.feedbacks;
CREATE POLICY "Users can view their own feedbacks" 
    ON public.feedbacks FOR SELECT TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update their own feedbacks" ON public.feedbacks;
CREATE POLICY "Users can update their own feedbacks" 
    ON public.feedbacks FOR UPDATE TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own feedbacks" ON public.feedbacks;
CREATE POLICY "Users can delete their own feedbacks" 
    ON public.feedbacks FOR DELETE TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin());

-- 6. Kebijakan RLS Tabel RECOMMENDATION_DATASETS & ENTRIES
DROP POLICY IF EXISTS "Users can perform all actions on their own recommendation_datas" ON public.recommendation_datasets;
CREATE POLICY "Users can perform all actions on their own recommendation_datas" 
    ON public.recommendation_datasets FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can perform all actions on their own dataset_entries" ON public.dataset_entries;
CREATE POLICY "Users can perform all actions on their own dataset_entries" 
    ON public.dataset_entries FOR ALL TO authenticated 
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());
