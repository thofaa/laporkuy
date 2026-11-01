INSERT INTO dinas (id, slug, name) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'dinas-pupr', 'Dinas PUPR')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (email, password_hash, full_name, role, dinas_id, is_active) VALUES
  ('siti.rahayu@example.com',
   'scrypt:1301e08d0ce836d83e5ce83aa7bca448:5617b05496cce6aab55957f94a2e278524adb523f14e12a6222ae7ef66e86ba54326efff4af688a83b6301d81c2353050785c9328da675d646467711c1c68ef7',
   'Siti Rahayu', 'user', NULL, true),
  ('instansi@laporkuy.dev',
   'scrypt:6e17dcc7b006e492ee50fa0423288633:de9b4e87bb790320ff8bda3388a5bb4c89dc3a656f8b693ab07cac62aefaaba9c7683617d0aa1766ede4ebdbb01d56444783f4992ff27a3c2453f4b0f2d8a842',
   'Petugas Instansi', 'pemerintah', 'd0000000-0000-0000-0000-000000000001', true),
  ('admin@example.com',
   'scrypt:d23461c188421e80840e5a665b2369ce:a4eb584ebc8396b73eb28ce29595a93bd036793adfda8b048e23f3f2bde0022161ec67098ff9af97a7c692841223ffcd3fe104b5d3d23ebaad11ae5b8ee62062',
   NULL, 'admin', NULL, true)
ON CONFLICT (email) DO NOTHING;

