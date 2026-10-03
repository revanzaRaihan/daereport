-- =====================================================================
-- MIGRATION: SECURE APP_SETTINGS RLS (LOCKDOWN AI SECRETS)
-- =====================================================================
-- Mencegah pengguna non-admin (guru biasa atau pendaftar baru) membaca
-- atau mengubah kunci API AI (ai_api_key, ai_provider, ai_model).
-- Pengguna authenticated biasa hanya dapat membaca dan mengubah pengaturan
-- umum dan preferensi personal (seperti app_locale, teacher_name, dll).
-- =====================================================================

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Drop policy lama yang mengizinkan pembacaan & penulisan tanpa batas
DROP POLICY IF EXISTS "Allow authenticated users to read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Allow authenticated users to delete app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can read non-sensitive app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can insert non-sensitive app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated users can update non-sensitive app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "Only admins can delete app_settings" ON public.app_settings;

-- 1. SELECT Policy: Admin dapat membaca semua, non-admin hanya pengaturan non-sensitif
CREATE POLICY "Authenticated users can read non-sensitive app_settings"
    ON public.app_settings FOR SELECT TO authenticated
    USING (
        public.is_admin() 
        OR key NOT IN ('ai_api_key', 'ai_provider', 'ai_model')
    );

-- 2. INSERT Policy: Admin dapat insert semua, non-admin hanya non-sensitif
CREATE POLICY "Authenticated users can insert non-sensitive app_settings"
    ON public.app_settings FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin() 
        OR key NOT IN ('ai_api_key', 'ai_provider', 'ai_model')
    );

-- 3. UPDATE Policy: Admin dapat update semua, non-admin hanya non-sensitif
CREATE POLICY "Authenticated users can update non-sensitive app_settings"
    ON public.app_settings FOR UPDATE TO authenticated
    USING (
        public.is_admin() 
        OR key NOT IN ('ai_api_key', 'ai_provider', 'ai_model')
    )
    WITH CHECK (
        public.is_admin() 
        OR key NOT IN ('ai_api_key', 'ai_provider', 'ai_model')
    );

-- 4. DELETE Policy: Hanya admin yang dapat menghapus pengaturan
CREATE POLICY "Only admins can delete app_settings"
    ON public.app_settings FOR DELETE TO authenticated
    USING (public.is_admin());
