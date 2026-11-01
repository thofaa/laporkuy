-- Melengkapi basis data lama tanpa menghapus laporan yang sudah ada.
alter table public.reports add column if not exists image_url text;
alter table public.reports add column if not exists progress_percent integer not null default 0
  check (progress_percent between 0 and 100);
alter table public.reports add column if not exists is_public boolean not null default false;
alter table public.reports add column if not exists public_title varchar(200);
alter table public.reports add column if not exists public_location varchar(500);
alter table public.report_status_history add column if not exists progress_percent integer not null default 0;
alter table public.sessions add column if not exists expires_at timestamptz not null default (now() + interval '7 days');
create index if not exists idx_reports_public on public.reports(moderation_status, is_public);
