-- =====================================================================
-- STARTER SEED DATA: DAELY REPORT STUDIO
-- =====================================================================
-- Deskripsi: Data awal bawaan untuk tabel dataset_entries &
-- recommendation_datasets agar sistem dapat langsung diuji coba
-- menghasilkan laporan dengan AI tanpa error dataset kosong.
-- =====================================================================

-- 1. SEED DATASET GAYA BAHASA INDONESIA (INDONESIAN STYLE SAMPLES)
INSERT INTO public.dataset_entries (section_type, language, body)
VALUES
    ('overview', 'id', 'Pada pertemuan hari ini, siswa mengikuti materi dengan antusias dan fokus yang sangat baik. Siswa berhasil menyelesaikan seluruh tantangan proyek sesuai target sesi pembelajaran.'),
    ('teachers_note', 'id', 'Pemahaman logika dan daya tangkap siswa sangat baik. Siswa mampu memahami alur instruksi secara mandiri dan cepat beradaptasi ketika menghadapi error pada kode.'),
    ('parent_note', 'id', 'Tetap berikan dukungan dan apresiasi di rumah. Bimbing siswa untuk mengulang proyek atau mencoba tantangan serupa di waktu luang agar daya ingat konsep semakin kuat.')
ON CONFLICT DO NOTHING;

-- 2. SEED DATASET GAYA BAHASA INGGRIS (ENGLISH STYLE SAMPLES)
INSERT INTO public.dataset_entries (section_type, language, body)
VALUES
    ('overview', 'en', 'In today''s session, the student showed great enthusiasm and deep focus throughout the lesson. The student successfully completed all core project milestones ahead of schedule.'),
    ('teachers_note', 'en', 'The student demonstrated strong logical thinking and problem-solving skills. When facing challenges, the student showed resilience and effectively debugged the issues independently.'),
    ('parent_note', 'en', 'Please continue encouraging the student at home. Reviewing today''s completed project together will help reinforce the concepts learned during class.')
ON CONFLICT DO NOTHING;

-- 3. SEED REKOMENDASI LATIHAN (PRACTICE RECOMMENDATIONS)
INSERT INTO public.recommendation_datasets (category, language, body)
VALUES
    ('coding_dasar', 'id', E'1. Latihan Algoritma Blok: https://studio.code.org/\n2. Eksplorasi tantangan mini di rumah selama 15-20 menit untuk memperkuat pemahaman sekuens perintah.'),
    ('logika_terstruktur', 'id', E'1. Tantangan Puzzle Logika & Conditional: https://studio.code.org/courses\n2. Siswa dapat mencoba memecahkan teka-teki logika sederhana untuk mengasah pola pikir komputasional.'),
    ('kreativitas', 'en', E'1. Creative Sandbox Projects: Explore creating interactive stories or custom animations.\n2. Focus on designing unique characters and customizing color themes to boost creative expression.'),
    ('eksperimen', 'en', E'1. Hands-on Experimentation: Try modifying project parameters to observe different outcomes.\n2. Encourage testing ''what-if'' scenarios to develop analytical thinking.')
ON CONFLICT DO NOTHING;

-- 4. SEED APP_SETTINGS DEFAULT (NON-SENSITIVE)
INSERT INTO public.app_settings (key, value)
VALUES
    ('app_locale', 'id'),
    ('ai_provider', 'gemini'),
    ('ai_model', 'gemini-2.5-flash')
ON CONFLICT (key) DO NOTHING;
