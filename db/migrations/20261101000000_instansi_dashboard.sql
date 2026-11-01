ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS resolution_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_request_note text;

CREATE TABLE IF NOT EXISTS public.report_feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id),
  sender_name varchar(255),
  sender_role user_role NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.instansi_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dinas_id uuid NOT NULL REFERENCES public.dinas(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  note text,
  scheduled_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_report_feedbacks_report ON public.report_feedbacks(report_id, created_at);
CREATE INDEX IF NOT EXISTS idx_instansi_schedules_dinas ON public.instansi_schedules(dinas_id, scheduled_at);
