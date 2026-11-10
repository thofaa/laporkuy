-- Seed data untuk routing Jev: 4 dinas + akun petugas, kategori & mapping ke dinas,
-- serta model config Jev. Idempoten (ON CONFLICT DO NOTHING).

-- 1. Dinas (perbarui nama dinas-pupr agar lengkap).
UPDATE public.dinas
SET name = 'Dinas Pekerjaan Umum, Penataan Ruang, Perumahan, dan Kawasan Permukiman'
WHERE slug = 'dinas-pupr';

INSERT INTO public.dinas (id, slug, name) VALUES
  ('d0000000-0000-0000-0000-000000000002', 'dinas-perhubungan', 'Dinas Perhubungan'),
  ('d0000000-0000-0000-0000-000000000003', 'dinas-pendidikan-kebudayaan', 'Dinas Pendidikan dan Kebudayaan'),
  ('d0000000-0000-0000-0000-000000000004', 'dinas-lingkungan-hidup', 'Dinas Lingkungan Hidup')
ON CONFLICT (slug) DO NOTHING;

-- 2. Akun petugas dinas (role pemerintah). Password seragam: InstansiDemo123!
INSERT INTO users (email, password_hash, full_name, role, dinas_id, is_active) VALUES
  ('pupr@demo.test',
   'scrypt:e539727301d3ad9aa2f38335ac59406c:8e61f8ddfe52b67d8ce379489ddcffbd9150dcbf146a5a4b87d771ad6f7c878b68d73992caf4196ac664a4d51569acd3e8d1ca78f2c2a81d9137efaf17f748b3',
   'Petugas Dinas PUPR', 'pemerintah', 'd0000000-0000-0000-0000-000000000001', true),
  ('perhubungan@demo.test',
   'scrypt:e539727301d3ad9aa2f38335ac59406c:8e61f8ddfe52b67d8ce379489ddcffbd9150dcbf146a5a4b87d771ad6f7c878b68d73992caf4196ac664a4d51569acd3e8d1ca78f2c2a81d9137efaf17f748b3',
   'Petugas Dinas Perhubungan', 'pemerintah', 'd0000000-0000-0000-0000-000000000002', true),
  ('pendidikan@demo.test',
   'scrypt:e539727301d3ad9aa2f38335ac59406c:8e61f8ddfe52b67d8ce379489ddcffbd9150dcbf146a5a4b87d771ad6f7c878b68d73992caf4196ac664a4d51569acd3e8d1ca78f2c2a81d9137efaf17f748b3',
   'Petugas Dinas Pendidikan dan Kebudayaan', 'pemerintah', 'd0000000-0000-0000-0000-000000000003', true),
  ('lingkungan@demo.test',
   'scrypt:e539727301d3ad9aa2f38335ac59406c:8e61f8ddfe52b67d8ce379489ddcffbd9150dcbf146a5a4b87d771ad6f7c878b68d73992caf4196ac664a4d51569acd3e8d1ca78f2c2a81d9137efaf17f748b3',
   'Petugas Dinas Lingkungan Hidup', 'pemerintah', 'd0000000-0000-0000-0000-000000000004', true)
ON CONFLICT (email) DO NOTHING;

-- 3. Kategori (slug mengikuti kunci pilihan Jev).
INSERT INTO public.kategori (id, slug, name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'infrastruktur_jalan', 'Infrastruktur Jalan'),
  ('a0000000-0000-0000-0000-000000000002', 'persampahan', 'Persampahan'),
  ('a0000000-0000-0000-0000-000000000003', 'penerangan_jalan', 'Penerangan Jalan'),
  ('a0000000-0000-0000-0000-000000000004', 'air_limbah', 'Air dan Limbah'),
  ('a0000000-0000-0000-0000-000000000005', 'transportasi', 'Transportasi'),
  ('a0000000-0000-0000-0000-000000000006', 'kesehatan', 'Kesehatan'),
  ('a0000000-0000-0000-0000-000000000007', 'lainnya', 'Lainnya'),
  ('a0000000-0000-0000-0000-000000000008', 'pendidikan_kebudayaan', 'Pendidikan dan Kebudayaan')
ON CONFLICT (slug) DO NOTHING;

-- 4. Mapping kategori -> dinas (sumber kebenaran validasi routing).
--    kesehatan & lainnya sengaja tanpa mapping sehingga laporan berlabel itu
--    selalu masuk needs_review untuk dicek admin.
INSERT INTO public.kategori_dinas (kategori_id, dinas_id, is_primary) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', true),
  ('a0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', true),
  ('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000001', true),
  ('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000004', false),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', true),
  ('a0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000002', true),
  ('a0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000003', true)
ON CONFLICT (kategori_id, dinas_id) DO NOTHING;

-- 5. Model config Jev aktif.
INSERT INTO ai.model_configs (id, provider, name, version, base_url, prompt_version, timeout_ms, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'external', 'typesafe/jev-1.13', 'jev-1.13',
   'https://openrouter.ai/api/v1', 'jev-v1', 30000, true)
ON CONFLICT (id) DO NOTHING;