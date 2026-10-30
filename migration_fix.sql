-- 1. Re-criar a função has_role caso não exista
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. Tentar criar a tabela de templates novamente (se não existir)
CREATE TABLE IF NOT EXISTS "public"."whatsapp_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "stage_id" text NOT NULL,
    "template_text" text NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
);

-- 3. Habilitar RLS e aplicar policies (re-executável)
ALTER TABLE "public"."whatsapp_templates" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read templates" ON "public"."whatsapp_templates";
CREATE POLICY "Allow authenticated users to read templates" ON "public"."whatsapp_templates"
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow admin to manage templates" ON "public"."whatsapp_templates";
CREATE POLICY "Allow admin to manage templates" ON "public"."whatsapp_templates"
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));
