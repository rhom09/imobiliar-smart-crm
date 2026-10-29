CREATE TABLE public.agency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Morada Imóveis',
  creci text NOT NULL DEFAULT 'CRECI-J 34.512',
  city text NOT NULL DEFAULT 'São Paulo, SP',
  address text NOT NULL DEFAULT 'Rua dos Pinheiros, 870 — Pinheiros',
  phone text NOT NULL DEFAULT '5511940028922',
  owner_name text NOT NULL DEFAULT 'Romilton Paixão',
  logo_url text DEFAULT NULL
);

GRANT SELECT ON public.agency TO authenticated;
GRANT INSERT, UPDATE ON public.agency TO authenticated;
GRANT ALL ON public.agency TO service_role;

ALTER TABLE public.agency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team can view agency" ON public.agency FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can update agency" ON public.agency FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can insert agency" ON public.agency FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default agency record if not exists
INSERT INTO public.agency (name, creci, city, address, phone, owner_name)
SELECT 'Morada Imóveis', 'CRECI-J 34.512', 'São Paulo, SP', 'Rua dos Pinheiros, 870 — Pinheiros', '5511940028922', 'Romilton Paixão'
WHERE NOT EXISTS (SELECT 1 FROM public.agency);
