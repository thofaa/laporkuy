-- Memulihkan kolom koordinat untuk fitur peta (/lapor, detail laporan).
-- Idempoten: berlaku untuk schema lama (sudah punya kolom) maupun fresh install teman (belum punya).
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS lng double precision;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS address text;

-- Backfill: baris lama isi titik tengah Malang + alamat dari "Lokasi:" di description_raw.
UPDATE public.reports
SET lat = COALESCE(lat, -7.98),
    lng = COALESCE(lng, 112.63),
    address = COALESCE(address, NULLIF(substring(description_raw from 'Lokasi: ([^\n]*)'), ''))
WHERE lat IS NULL OR lng IS NULL;

ALTER TABLE public.reports
  ALTER COLUMN lat SET NOT NULL,
  ALTER COLUMN lng SET NOT NULL;
