-- =====================================================================
-- MIGRATION: ADD PERFORMANCE INDEXES FOR FOREIGN KEYS & QUERY SPEED
-- =====================================================================
-- Menambahkan indeks B-Tree pada foreign key yang sering di-query
-- agar performa portal ortu (/p/[slug]) dan dashboard guru tetap < 10ms
-- saat data laporan bertambah hingga puluhan ribu baris.
-- =====================================================================

-- 1. Optimasi query laporan per murid (Parent Portal & Riwayat)
CREATE INDEX IF NOT EXISTS idx_reports_student_id_date 
ON public.reports (student_id, report_date DESC);

-- 2. Optimasi filter kepemilikan guru (RLS & Dashboard)
CREATE INDEX IF NOT EXISTS idx_reports_user_id 
ON public.reports (user_id);

CREATE INDEX IF NOT EXISTS idx_students_user_id 
ON public.students (user_id);

-- 3. Optimasi query feedbacks & schedules
CREATE INDEX IF NOT EXISTS idx_feedbacks_student_id 
ON public.feedbacks (student_id);

CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id 
ON public.feedbacks (user_id);

CREATE INDEX IF NOT EXISTS idx_schedules_user_id 
ON public.schedules (user_id);
