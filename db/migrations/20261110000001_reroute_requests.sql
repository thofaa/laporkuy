-- Permintaan perutean ulang (Rutekan Balik) oleh pelapor, diputuskan admin.
-- Juga dipakai saat pelapor memilih dinas langsung pada form buat laporan.
CREATE TABLE IF NOT EXISTS public.routing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  requested_dinas_id uuid NOT NULL REFERENCES public.dinas(id),
  requested_by uuid NOT NULL REFERENCES public.users(id),
  previous_status report_status NOT NULL,
  note text,
  status varchar(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  decided_by uuid REFERENCES public.users(id),
  decided_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routing_requests_report ON public.routing_requests(report_id, status, created_at);