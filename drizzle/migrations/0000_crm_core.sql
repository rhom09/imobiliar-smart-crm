CREATE TYPE public.app_role AS ENUM ('admin', 'corretor');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  creci text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Team can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Own or admin update profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Team can view roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, creci)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'creci', '')
  );
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'corretor');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE SEQUENCE public.property_code_seq START 1100;

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE DEFAULT ('MOR-' || nextval('public.property_code_seq')),
  title text NOT NULL,
  type text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  neighborhood text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT 'São Paulo',
  address text NOT NULL DEFAULT '',
  bedrooms int NOT NULL DEFAULT 0,
  suites int NOT NULL DEFAULT 0,
  bathrooms int NOT NULL DEFAULT 0,
  parking int NOT NULL DEFAULT 0,
  area numeric NOT NULL DEFAULT 0,
  condo numeric NOT NULL DEFAULT 0,
  iptu numeric NOT NULL DEFAULT 0,
  description text NOT NULL DEFAULT '',
  features text[] NOT NULL DEFAULT '{}',
  photos text[] NOT NULL DEFAULT '{}',
  broker_id uuid,
  status text NOT NULL DEFAULT 'disponivel',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT USAGE ON SEQUENCE public.property_code_seq TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team can view properties" ON public.properties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Team can add properties" ON public.properties FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Broker or admin update property" ON public.properties FOR UPDATE TO authenticated
  USING (broker_id = auth.uid() OR broker_id IS NULL OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin delete property" ON public.properties FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  owner_id uuid NOT NULL,
  stage text NOT NULL DEFAULT 'novo',
  property_type text NOT NULL DEFAULT 'Apartamento',
  budget_min numeric NOT NULL DEFAULT 0,
  budget_max numeric NOT NULL DEFAULT 0,
  bedrooms int NOT NULL DEFAULT 0,
  neighborhoods text[] NOT NULL DEFAULT '{}',
  interest_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_contact_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin view leads" ON public.leads FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin add leads" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin update leads" ON public.leads FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin delete leads" ON public.leads FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.can_access_lead(_lead_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.leads l WHERE l.id = _lead_id
    AND (l.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin')))
$$;

CREATE TABLE public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  kind text NOT NULL,
  text text NOT NULL DEFAULT '',
  at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz,
  author_id uuid NOT NULL DEFAULT auth.uid()
);
CREATE INDEX interactions_lead_idx ON public.interactions(lead_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interactions TO authenticated;
GRANT ALL ON public.interactions TO service_role;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "View interactions of visible leads" ON public.interactions FOR SELECT TO authenticated
  USING (public.can_access_lead(lead_id));
CREATE POLICY "Add interactions to visible leads" ON public.interactions FOR INSERT TO authenticated
  WITH CHECK (public.can_access_lead(lead_id) AND author_id = auth.uid());

INSERT INTO public.properties (code,title,type,price,neighborhood,city,address,bedrooms,suites,bathrooms,parking,area,condo,iptu,description,features,photos,status,created_at) VALUES
('MOR-1021','Apartamento vista skyline','Apartamento',1480000,'Pinheiros','São Paulo','Rua Cardeal Arcoverde, 1200',3,1,2,2,112,1450,380,'Andar alto com janelas do piso ao teto e vista aberta para o skyline. Living integrado, cozinha americana e varanda. Prédio com lazer completo a 5 minutos do metrô Fradique Coutinho.',ARRAY['Varanda','Piscina','Academia','Portaria 24h','Pet friendly']::text[],ARRAY['asset:living','asset:kitchen','asset:bedroom','asset:bath']::text[],'disponivel','2026-10-09T04:16:00.592Z'),
('MOR-1034','Casa contemporânea com piscina','Casa',4250000,'Brooklin','São Paulo','Rua Barão do Triunfo, 455',4,4,6,4,420,0,1900,'Projeto assinado com fachada em concreto e madeira, jardim tropical, piscina aquecida e área gourmet integrada. Suítes amplas e home office.',ARRAY['Piscina aquecida','Área gourmet','Jardim','Energia solar','Home office']::text[],ARRAY['asset:house','asset:kitchen','asset:bedroom','asset:bath']::text[],'disponivel','2026-09-21T04:16:00.592Z'),
('MOR-1040','Cobertura duplex com piscina privativa','Cobertura',5900000,'Itaim Bibi','São Paulo','Rua Joaquim Floriano, 300',4,3,5,4,340,4200,2100,'Cobertura com terraço, piscina com borda infinita e pôr do sol sobre a cidade. Acabamento de alto padrão e automação completa.',ARRAY['Piscina privativa','Terraço','Automação','Churrasqueira','Adega']::text[],ARRAY['asset:penthouse','asset:living','asset:bedroom','asset:bath']::text[],'disponivel','2026-10-13T04:16:00.592Z'),
('MOR-1052','Studio mezanino próximo ao metrô','Studio',520000,'Vila Madalena','São Paulo','Rua Aspicuelta, 88',1,0,1,0,38,690,95,'Studio com pé-direito duplo e mezanino, estilo industrial, na rua mais charmosa da Vila. Ideal para investidor ou primeiro imóvel.',ARRAY['Pé-direito duplo','Mezanino','Lavanderia coletiva','Bicicletário']::text[],ARRAY['asset:studio','asset:building','asset:bath']::text[],'disponivel','2026-10-17T04:16:00.592Z'),
('MOR-1058','Apartamento familiar com lazer','Apartamento',1150000,'Moema','São Paulo','Av. Ibirapuera, 2400',3,1,2,2,98,1200,310,'A duas quadras do Parque Ibirapuera, planta funcional com três dormitórios, varanda gourmet e condomínio com playground e piscina.',ARRAY['Varanda gourmet','Playground','Piscina','Salão de festas']::text[],ARRAY['asset:building','asset:living','asset:kitchen','asset:bedroom']::text[],'disponivel','2026-10-01T04:16:00.592Z'),
('MOR-1063','Apartamento reformado nos Jardins','Apartamento',2350000,'Jardins','São Paulo','Alameda Lorena, 1500',3,2,3,2,160,2300,720,'Prédio clássico com apartamento totalmente reformado: cozinha em marcenaria de carvalho, banheiros em terrazzo e piso de madeira.',ARRAY['Reformado','Marcenaria','Portaria 24h','Depósito']::text[],ARRAY['asset:kitchen','asset:living','asset:bath','asset:bedroom']::text[],'reservado','2026-10-06T04:16:00.592Z'),
('MOR-1070','Apartamento compacto em Perdizes','Apartamento',690000,'Perdizes','São Paulo','Rua Cardoso de Almeida, 1700',2,1,2,1,64,820,160,'Dois dormitórios com suíte, sol da manhã e varanda. Bairro arborizado, próximo à PUC e ao Allianz Parque.',ARRAY['Varanda','Sol da manhã','Academia','Coworking']::text[],ARRAY['asset:bedroom','asset:living','asset:kitchen']::text[],'disponivel','2026-10-19T04:16:00.592Z'),
('MOR-1077','Sobrado com quintal na Vila Mariana','Sobrado',1780000,'Vila Mariana','São Paulo','Rua Domingos de Morais, 2900',3,1,3,2,210,0,640,'Sobrado em rua tranquila, com quintal, churrasqueira e edícula. A 600 m do metrô Santa Cruz.',ARRAY['Quintal','Churrasqueira','Edícula','Rua tranquila']::text[],ARRAY['asset:house','asset:living','asset:bedroom']::text[],'disponivel','2026-09-11T04:16:00.592Z'),
('MOR-1081','Casa térrea com jardim','Casa',2100000,'Moema','São Paulo','Rua Gaivota, 610',3,2,3,3,260,0,980,'Casa térrea em Moema Pássaros, jardim amplo, cozinha integrada e piscina. Ótima para famílias.',ARRAY['Piscina','Jardim','Térrea','Lareira']::text[],ARRAY['asset:house','asset:kitchen','asset:bath']::text[],'disponivel','2026-10-15T04:16:00.592Z'),
('MOR-1088','Studio mobiliado no Itaim','Studio',610000,'Itaim Bibi','São Paulo','Rua Tabapuã, 1100',1,1,1,1,36,950,120,'Studio entregue mobiliado em prédio novo com rooftop, piscina e lavanderia. Excelente para renda.',ARRAY['Mobiliado','Rooftop','Piscina','Lavanderia']::text[],ARRAY['asset:studio','asset:penthouse','asset:bath']::text[],'vendido','2026-08-27T04:16:00.592Z');
SELECT setval('public.property_code_seq', 1200);