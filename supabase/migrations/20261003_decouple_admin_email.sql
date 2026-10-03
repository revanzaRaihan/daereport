-- =====================================================================
-- MIGRATION: DECOUPLE ADMIN ROLE FROM HARDCODED EMAIL
-- =====================================================================
-- Memastikan fungsi public.is_admin() murni mengecek metadata role ('admin')
-- pada user_metadata maupun app_metadata tanpa dependensi pada alamat email tertentu.
-- =====================================================================

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
