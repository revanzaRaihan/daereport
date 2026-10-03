-- =====================================================================
-- MIGRATION: ADD INDEXED SLUG TO STUDENTS TABLE WITH AUTO-GENERATION
-- =====================================================================
-- Solusi 1: Mengoptimasi query portal orang tua (/p/[slug]) dari O(N) in-memory
-- menjadi O(1) query terindeks di database Supabase.
-- =====================================================================

-- 1. Tambah kolom slug jika belum ada
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Buat fungsi trigger untuk generate slug otomatis & mencegah tabrakan nama
CREATE OR REPLACE FUNCTION public.generate_student_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate_slug TEXT;
  counter INT := 1;
BEGIN
  -- Gunakan slug yang dikirim, atau generate dari nama murid
  IF NEW.slug IS NOT NULL AND trim(NEW.slug) <> '' THEN
    base_slug := lower(regexp_replace(regexp_replace(trim(NEW.slug), '[^a-zA-Z0-9\s-]', '', 'g'), '[\s_-]+', '-', 'g'));
  ELSE
    base_slug := lower(regexp_replace(regexp_replace(trim(NEW.name), '[^a-zA-Z0-9\s-]', '', 'g'), '[\s_-]+', '-', 'g'));
  END IF;

  base_slug := trim(both '-' from base_slug);
  IF base_slug = '' THEN
    base_slug := 'student';
  END IF;

  candidate_slug := base_slug;

  -- Pastikan unik: jika slug sudah dipakai murid lain, beri akhiran -2, -3, dst.
  WHILE EXISTS (
    SELECT 1 FROM public.students 
    WHERE slug = candidate_slug 
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) LOOP
    counter := counter + 1;
    candidate_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := candidate_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Pasang trigger pada INSERT dan UPDATE
DROP TRIGGER IF EXISTS trg_generate_student_slug ON public.students;
CREATE TRIGGER trg_generate_student_slug
BEFORE INSERT OR UPDATE OF name, slug ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.generate_student_slug();

-- 3. Backfill seluruh murid yang ada saat ini (trigger akan mengisi slug otomatis)
UPDATE public.students 
SET slug = NULL 
WHERE slug IS NULL;

-- 4. Buat unique index untuk performa O(1)
CREATE UNIQUE INDEX IF NOT EXISTS students_slug_unique_idx 
ON public.students (slug);
