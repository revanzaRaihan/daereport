-- =====================================================================
-- MIGRATION: ADMIN TEACHERS OVERVIEW & STUDENT TRANSFER FUNCTION
-- =====================================================================

-- 1. Fungsi untuk mendapatkan rekap guru yang memiliki murid (>0)
CREATE OR REPLACE FUNCTION public.get_teachers_overview()
RETURNS TABLE (
    teacher_id UUID,
    email VARCHAR,
    name TEXT,
    student_count BIGINT
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS teacher_id,
        u.email,
        COALESCE(
            NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
            NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
            split_part(u.email, '@', 1)
        ) AS name,
        COUNT(s.id) AS student_count
    FROM auth.users u
    INNER JOIN public.students s ON s.user_id = u.id
    GROUP BY u.id, u.email, u.raw_user_meta_data
    HAVING COUNT(s.id) > 0
    ORDER BY student_count DESC, name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_teachers_overview() TO authenticated;

-- 2. Fungsi untuk mendapatkan daftar seluruh guru terdaftar (untuk dropdown transfer)
CREATE OR REPLACE FUNCTION public.get_all_teachers()
RETURNS TABLE (
    teacher_id UUID,
    email VARCHAR,
    name TEXT
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS teacher_id,
        u.email,
        COALESCE(
            NULLIF(trim(u.raw_user_meta_data->>'full_name'), ''),
            NULLIF(trim(u.raw_user_meta_data->>'name'), ''),
            split_part(u.email, '@', 1)
        ) AS name
    FROM auth.users u
    WHERE u.email NOT IN ('admin@reportstudio.test')
    ORDER BY name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_teachers() TO authenticated;

-- 3. Fungsi aman untuk memindahkan murid & laporannya ke guru baru oleh admin
CREATE OR REPLACE FUNCTION public.transfer_student(
    target_student_id UUID,
    new_teacher_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verifikasi bahwa pemanggil adalah admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya admin yang dapat memindahkan murid.';
    END IF;

    -- Pindahkan murid
    UPDATE public.students 
    SET user_id = new_teacher_id, updated_at = now()
    WHERE id = target_student_id;

    -- Pindahkan seluruh riwayat laporan murid ke guru baru
    UPDATE public.reports
    SET user_id = new_teacher_id, updated_at = now()
    WHERE student_id = target_student_id;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_student(UUID, UUID) TO authenticated;
