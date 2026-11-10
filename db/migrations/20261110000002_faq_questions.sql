-- Pertanyaan pengguna dari halaman FAQ; dijawab admin di dashboard.
CREATE TABLE IF NOT EXISTS public.faq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id),
  question text NOT NULL,
  answer text,
  answered_by uuid REFERENCES public.users(id),
  answered_at timestamptz,
  status varchar(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faq_questions_status ON public.faq_questions(status, created_at);
CREATE INDEX IF NOT EXISTS idx_faq_questions_user ON public.faq_questions(user_id, created_at);