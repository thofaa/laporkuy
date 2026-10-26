-- Laporkuy MVP schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS ai;

CREATE TYPE user_role AS ENUM ('user', 'pemerintah', 'admin');
CREATE TYPE report_status AS ENUM ('submitted','needs_review','routed','accepted','in_progress','resolved','rejected','merged');
CREATE TYPE moderation_status AS ENUM ('pending','published','masked','held','rejected');
CREATE TYPE urgency_level AS ENUM ('rendah','sedang','tinggi','darurat');

CREATE TABLE public.dinas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(64) UNIQUE NOT NULL,
  name varchar(255) NOT NULL,
  scope text,
  phone varchar(32),
  email varchar(255),
  hours jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) UNIQUE NOT NULL,
  password_hash varchar(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  dinas_id uuid REFERENCES public.dinas(id),
  full_name varchar(255),
  is_active boolean DEFAULT true,
  email_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.kategori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(64) UNIQUE NOT NULL,
  name varchar(128) NOT NULL,
  coverage text,
  examples text[],
  sort_order int DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE public.kategori_dinas (
  kategori_id uuid NOT NULL REFERENCES public.kategori(id) ON DELETE CASCADE,
  dinas_id uuid NOT NULL REFERENCES public.dinas(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT true,
  PRIMARY KEY (kategori_id, dinas_id)
);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number varchar(32) UNIQUE NOT NULL,
  user_id uuid REFERENCES public.users(id),
  contact_name varchar(255),
  contact_email varchar(255),
  contact_phone varchar(32),
  description_raw text NOT NULL,
  description_redacted text,
  image_url text,
  category_id uuid REFERENCES public.kategori(id),
  dinas_id uuid REFERENCES public.dinas(id),
  urgency urgency_level,
  status report_status NOT NULL DEFAULT 'submitted',
  moderation_status moderation_status NOT NULL DEFAULT 'pending',
  merged_into_id uuid REFERENCES public.reports(id),
  submitted_at timestamptz DEFAULT now(),
  routed_at timestamptz,
  accepted_at timestamptz,
  resolved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  from_status report_status,
  to_status report_status NOT NULL,
  actor_id uuid REFERENCES public.users(id),
  actor_type text,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.report_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  storage_key text NOT NULL,
  filename text NOT NULL,
  mime_type text,
  size_bytes int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_type text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  metadata jsonb,
  ip text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ai.model_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  name text NOT NULL,
  version text,
  base_url text,
  prompt_version text,
  timeout_ms int,
  is_active boolean DEFAULT false,
  shadow_of_id uuid REFERENCES ai.model_configs(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE ai.classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  model_config_id uuid NOT NULL REFERENCES ai.model_configs(id),
  input_redacted text,
  input_sent text,
  output_json jsonb,
  dinas_id uuid REFERENCES public.dinas(id),
  category_id uuid REFERENCES public.kategori(id),
  urgency text,
  confidence double precision,
  category_confidence double precision,
  dinas_confidence double precision,
  urgency_confidence double precision,
  pii_types text[],
  latency_ms int,
  token_usage jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE ai.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  classification_id uuid UNIQUE NOT NULL REFERENCES ai.classifications(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES public.users(id),
  corrected_dinas_id uuid REFERENCES public.dinas(id),
  corrected_category_id uuid REFERENCES public.kategori(id),
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_dinas_status ON public.reports(dinas_id, status);
CREATE INDEX idx_reports_category_id ON public.reports(category_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);
CREATE INDEX idx_report_status_history_report ON public.report_status_history(report_id, created_at);
CREATE INDEX idx_report_attachments_report ON public.report_attachments(report_id);
