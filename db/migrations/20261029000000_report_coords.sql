ALTER TABLE public.reports
  ADD COLUMN lat double precision,
  ADD COLUMN lng double precision,
  ADD COLUMN address text;

-- ponytail: 4 baris lama belum punya koordinat; isi titik tengah Malang + alamat dari "Lokasi:" di description_raw
UPDATE public.reports
SET address = COALESCE(address,
      NULLIF(substring(description_raw from 'Lokasi: ([^\n]*)'), '')),
    lat = COALESCE(lat, -7.98),
    lng = COALESCE(lng, 112.63)
WHERE lat IS NULL OR lng IS NULL;

ALTER TABLE public.reports
  ALTER COLUMN lat SET NOT NULL,
  ALTER COLUMN lng SET NOT NULL;
