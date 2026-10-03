-- =====================================================================
-- MIGRATION: HISTORY TEACHERS OVERVIEW FOR ADMIN
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_history_teachers_overview()
RETURNS TABLE (
    teacher_id UUID,
    email VARCHAR,
    name TEXT,
    student_count BIGINT,
    report_count BIGINT
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
        COUNT(DISTINCT s.id) AS student_count,
        COUNT(DISTINCT r.id) AS report_count
    FROM auth.users u
    LEFT JOIN public.students s ON s.user_id = u.id AND s.deleted_at IS NULL
    LEFT JOIN public.reports r ON r.user_id = u.id AND r.deleted_at IS NULL
    GROUP BY u.id, u.email, u.raw_user_meta_data
    HAVING COUNT(DISTINCT r.id) > 0 OR COUNT(DISTINCT s.id) > 0
    ORDER BY report_count DESC, name ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_history_teachers_overview() TO authenticated;
