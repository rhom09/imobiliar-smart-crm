-- Add unique constraint on stage_id for whatsapp_templates upsert
ALTER TABLE "public"."whatsapp_templates" DROP CONSTRAINT IF EXISTS whatsapp_templates_stage_id_key;
ALTER TABLE "public"."whatsapp_templates" ADD CONSTRAINT whatsapp_templates_stage_id_key UNIQUE (stage_id);

GRANT SELECT ON public.whatsapp_templates TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
