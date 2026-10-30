CREATE TABLE IF NOT EXISTS "public"."whatsapp_templates" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "stage_id" text NOT NULL,
    "template_text" text NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "public"."whatsapp_templates" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read templates" ON "public"."whatsapp_templates"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin to manage templates" ON "public"."whatsapp_templates"
    FOR ALL USING (has_role('admin'));
