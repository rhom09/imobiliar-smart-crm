import type { Agency, Broker, Interaction, Lead, Property, PropertyType, StageId } from "./types";

export const AGENCY: Agency = {
  name: "Morada Imóveis",
  creci: "CRECI-J 34.512",
  city: "São Paulo, SP",
  address: "Rua dos Pinheiros, 870 — Pinheiros",
  phone: "5511940028922",
  ownerName: "Romilton Paixão",
};

export const BROKERS: Broker[] = [
  { id: "b1", name: "Carla Mendes", phone: "5511981234501", creci: "CRECI 187.402-F", initials: "CM" },
  { id: "b2", name: "Diego Santos", phone: "5511981234502", creci: "CRECI 201.877-F", initials: "DS" },
  { id: "b3", name: "Juliana Rocha", phone: "5511981234503", creci: "CRECI 176.033-F", initials: "JR" },
];

type PropSeed = Omit<Property, "createdAt" | "city"> & { daysAgo: number };

const PROPS: PropSeed[] = [
  {
    id: "p1", code: "MOR-1021", title: "Apartamento vista skyline", type: "Apartamento", price: 1_480_000,
    neighborhood: "Pinheiros", address: "Rua Cardeal Arcoverde, 1200", bedrooms: 3, suites: 1, bathrooms: 2,
    parking: 2, area: 112, condo: 1450, iptu: 380,
    description: "Andar alto com janelas do piso ao teto e vista aberta para o skyline. Living integrado, cozinha americana e varanda. Prédio com lazer completo a 5 minutos do metrô Fradique Coutinho.",
    features: ["Varanda", "Piscina", "Academia", "Portaria 24h", "Pet friendly"],
    photos: ["asset:living", "asset:kitchen", "asset:bedroom", "asset:bath"], brokerId: "b1", status: "disponivel", daysAgo: 12,
  },
  {
    id: "p2", code: "MOR-1034", title: "Casa contemporânea com piscina", type: "Casa", price: 4_250_000,
    neighborhood: "Brooklin", address: "Rua Barão do Triunfo, 455", bedrooms: 4, suites: 4, bathrooms: 6,
    parking: 4, area: 420, condo: 0, iptu: 1900,
    description: "Projeto assinado com fachada em concreto e madeira, jardim tropical, piscina aquecida e área gourmet integrada. Suítes amplas e home office.",
    features: ["Piscina aquecida", "Área gourmet", "Jardim", "Energia solar", "Home office"],
    photos: ["asset:house", "asset:kitchen", "asset:bedroom", "asset:bath"], brokerId: "b2", status: "disponivel", daysAgo: 30,
  },
  {
    id: "p3", code: "MOR-1040", title: "Cobertura duplex com piscina privativa", type: "Cobertura", price: 5_900_000,
    neighborhood: "Itaim Bibi", address: "Rua Joaquim Floriano, 300", bedrooms: 4, suites: 3, bathrooms: 5,
    parking: 4, area: 340, condo: 4200, iptu: 2100,
    description: "Cobertura com terraço, piscina com borda infinita e pôr do sol sobre a cidade. Acabamento de alto padrão e automação completa.",
    features: ["Piscina privativa", "Terraço", "Automação", "Churrasqueira", "Adega"],
    photos: ["asset:penthouse", "asset:living", "asset:bedroom", "asset:bath"], brokerId: "b3", status: "disponivel", daysAgo: 8,
  },
  {
    id: "p4", code: "MOR-1052", title: "Studio mezanino próximo ao metrô", type: "Studio", price: 520_000,
    neighborhood: "Vila Madalena", address: "Rua Aspicuelta, 88", bedrooms: 1, suites: 0, bathrooms: 1,
    parking: 0, area: 38, condo: 690, iptu: 95,
    description: "Studio com pé-direito duplo e mezanino, estilo industrial, na rua mais charmosa da Vila. Ideal para investidor ou primeiro imóvel.",
    features: ["Pé-direito duplo", "Mezanino", "Lavanderia coletiva", "Bicicletário"],
    photos: ["asset:studio", "asset:building", "asset:bath"], brokerId: "b1", status: "disponivel", daysAgo: 4,
  },
  {
    id: "p5", code: "MOR-1058", title: "Apartamento familiar com lazer", type: "Apartamento", price: 1_150_000,
    neighborhood: "Moema", address: "Av. Ibirapuera, 2400", bedrooms: 3, suites: 1, bathrooms: 2,
    parking: 2, area: 98, condo: 1200, iptu: 310,
    description: "A duas quadras do Parque Ibirapuera, planta funcional com três dormitórios, varanda gourmet e condomínio com playground e piscina.",
    features: ["Varanda gourmet", "Playground", "Piscina", "Salão de festas"],
    photos: ["asset:building", "asset:living", "asset:kitchen", "asset:bedroom"], brokerId: "b2", status: "disponivel", daysAgo: 20,
  },
  {
    id: "p6", code: "MOR-1063", title: "Apartamento reformado nos Jardins", type: "Apartamento", price: 2_350_000,
    neighborhood: "Jardins", address: "Alameda Lorena, 1500", bedrooms: 3, suites: 2, bathrooms: 3,
    parking: 2, area: 160, condo: 2300, iptu: 720,
    description: "Prédio clássico com apartamento totalmente reformado: cozinha em marcenaria de carvalho, banheiros em terrazzo e piso de madeira.",
    features: ["Reformado", "Marcenaria", "Portaria 24h", "Depósito"],
    photos: ["asset:kitchen", "asset:living", "asset:bath", "asset:bedroom"], brokerId: "b3", status: "reservado", daysAgo: 15,
  },
  {
    id: "p7", code: "MOR-1070", title: "Apartamento compacto em Perdizes", type: "Apartamento", price: 690_000,
    neighborhood: "Perdizes", address: "Rua Cardoso de Almeida, 1700", bedrooms: 2, suites: 1, bathrooms: 2,
    parking: 1, area: 64, condo: 820, iptu: 160,
    description: "Dois dormitórios com suíte, sol da manhã e varanda. Bairro arborizado, próximo à PUC e ao Allianz Parque.",
    features: ["Varanda", "Sol da manhã", "Academia", "Coworking"],
    photos: ["asset:bedroom", "asset:living", "asset:kitchen"], brokerId: "b1", status: "disponivel", daysAgo: 2,
  },
  {
    id: "p8", code: "MOR-1077", title: "Sobrado com quintal na Vila Mariana", type: "Sobrado", price: 1_780_000,
    neighborhood: "Vila Mariana", address: "Rua Domingos de Morais, 2900", bedrooms: 3, suites: 1, bathrooms: 3,
    parking: 2, area: 210, condo: 0, iptu: 640,
    description: "Sobrado em rua tranquila, com quintal, churrasqueira e edícula. A 600 m do metrô Santa Cruz.",
    features: ["Quintal", "Churrasqueira", "Edícula", "Rua tranquila"],
    photos: ["asset:house", "asset:living", "asset:bedroom"], brokerId: "b2", status: "disponivel", daysAgo: 40,
  },
  {
    id: "p9", code: "MOR-1081", title: "Casa térrea com jardim", type: "Casa", price: 2_100_000,
    neighborhood: "Moema", address: "Rua Gaivota, 610", bedrooms: 3, suites: 2, bathrooms: 3,
    parking: 3, area: 260, condo: 0, iptu: 980,
    description: "Casa térrea em Moema Pássaros, jardim amplo, cozinha integrada e piscina. Ótima para famílias.",
    features: ["Piscina", "Jardim", "Térrea", "Lareira"],
    photos: ["asset:house", "asset:kitchen", "asset:bath"], brokerId: "b3", status: "disponivel", daysAgo: 6,
  },
  {
    id: "p10", code: "MOR-1088", title: "Studio mobiliado no Itaim", type: "Studio", price: 610_000,
    neighborhood: "Itaim Bibi", address: "Rua Tabapuã, 1100", bedrooms: 1, suites: 1, bathrooms: 1,
    parking: 1, area: 36, condo: 950, iptu: 120,
    description: "Studio entregue mobiliado em prédio novo com rooftop, piscina e lavanderia. Excelente para renda.",
    features: ["Mobiliado", "Rooftop", "Piscina", "Lavanderia"],
    photos: ["asset:studio", "asset:penthouse", "asset:bath"], brokerId: "b1", status: "vendido", daysAgo: 55,
  },
];

type LeadSeed = {
  id: string; name: string; phone: string; ownerId: string; stage: StageId; type: PropertyType;
  min: number; max: number; beds: number; hoods: string[]; interest?: string; source: string;
  createdDays: number; lastHours: number; notes: [string, Interaction["kind"], number][]; visitInDays?: number;
};

const LEADS: LeadSeed[] = [
  { id: "l1", name: "Mariana Alves", phone: "5511991110001", ownerId: "b1", stage: "novo", type: "Apartamento", min: 1_100_000, max: 1_500_000, beds: 3, hoods: ["Pinheiros", "Vila Madalena"], interest: "p1", source: "Portal ZAP", createdDays: 0, lastHours: 3, notes: [["Lead entrou pelo portal pedindo mais fotos do MOR-1021.", "nota", 3]] },
  { id: "l2", name: "Rafael Costa", phone: "5511991110002", ownerId: "b2", stage: "novo", type: "Casa", min: 3_000_000, max: 4_500_000, beds: 4, hoods: ["Brooklin", "Moema"], source: "Instagram", createdDays: 1, lastHours: 26, notes: [["Respondeu anúncio patrocinado de casa no Brooklin.", "nota", 26]] },
  { id: "l3", name: "Beatriz Lima", phone: "5511991110003", ownerId: "b3", stage: "novo", type: "Cobertura", min: 4_500_000, max: 6_500_000, beds: 4, hoods: ["Itaim Bibi", "Jardins"], interest: "p3", source: "Indicação", createdDays: 2, lastHours: 50, notes: [["Indicada pelo cliente Paulo Reis. Busca cobertura com piscina.", "nota", 50]] },
  { id: "l4", name: "Lucas Ferreira", phone: "5511991110004", ownerId: "b1", stage: "contato", type: "Studio", min: 400_000, max: 650_000, beds: 1, hoods: ["Vila Madalena", "Itaim Bibi"], interest: "p4", source: "Site", createdDays: 6, lastHours: 30, notes: [["Investidor, quer imóvel para Airbnb.", "ligacao", 120], ["Enviei opções de studios pelo WhatsApp.", "whatsapp", 30]] },
  { id: "l5", name: "Fernanda Souza", phone: "5511991110005", ownerId: "b2", stage: "contato", type: "Apartamento", min: 900_000, max: 1_250_000, beds: 3, hoods: ["Moema", "Vila Mariana"], interest: "p5", source: "Portal VivaReal", createdDays: 9, lastHours: 110, notes: [["Casal com 2 filhos, quer perto do parque.", "ligacao", 200], ["Pediu planta do MOR-1058.", "whatsapp", 110]] },
  { id: "l6", name: "Gustavo Nunes", phone: "5511991110006", ownerId: "b3", stage: "contato", type: "Apartamento", min: 2_000_000, max: 2_600_000, beds: 3, hoods: ["Jardins", "Pinheiros"], source: "Site", createdDays: 14, lastHours: 200, notes: [["Primeiro contato por telefone, sem retorno desde então.", "ligacao", 200]] },
  { id: "l7", name: "Camila Ribeiro", phone: "5511991110007", ownerId: "b1", stage: "visita", type: "Apartamento", min: 600_000, max: 750_000, beds: 2, hoods: ["Perdizes", "Pinheiros"], interest: "p7", source: "Instagram", createdDays: 10, lastHours: 20, notes: [["Gostou muito do MOR-1070 pelas fotos.", "whatsapp", 72], ["Visita agendada para sábado às 10h.", "visita", 20]], visitInDays: 2 },
  { id: "l8", name: "Thiago Martins", phone: "5511991110008", ownerId: "b2", stage: "visita", type: "Sobrado", min: 1_500_000, max: 1_900_000, beds: 3, hoods: ["Vila Mariana"], interest: "p8", source: "Placa no imóvel", createdDays: 12, lastHours: 46, notes: [["Viu a placa e ligou.", "ligacao", 150], ["Visita marcada com a esposa.", "visita", 46]], visitInDays: 1 },
  { id: "l9", name: "Patrícia Gomes", phone: "5511991110009", ownerId: "b3", stage: "visita", type: "Casa", min: 1_800_000, max: 2_300_000, beds: 3, hoods: ["Moema", "Brooklin"], interest: "p9", source: "Indicação", createdDays: 18, lastHours: 90, notes: [["Quer casa térrea por causa dos pais idosos.", "nota", 300], ["Visita confirmada.", "visita", 90]], visitInDays: 3 },
  { id: "l10", name: "André Carvalho", phone: "5511991110010", ownerId: "b1", stage: "proposta", type: "Apartamento", min: 1_300_000, max: 1_550_000, beds: 3, hoods: ["Pinheiros"], interest: "p1", source: "Portal ZAP", createdDays: 25, lastHours: 60, notes: [["Visitou o MOR-1021, adorou a vista.", "visita", 240], ["Proposta enviada: R$ 1.390.000 à vista.", "nota", 60]] },
  { id: "l11", name: "Juliana Prado", phone: "5511991110011", ownerId: "b3", stage: "proposta", type: "Apartamento", min: 2_100_000, max: 2_400_000, beds: 3, hoods: ["Jardins"], interest: "p6", source: "Site", createdDays: 30, lastHours: 180, notes: [["Proposta com financiamento de 60%.", "nota", 180]] },
  { id: "l12", name: "Ricardo Almeida", phone: "5511991110012", ownerId: "b2", stage: "proposta", type: "Casa", min: 3_800_000, max: 4_300_000, beds: 4, hoods: ["Brooklin"], interest: "p2", source: "Indicação", createdDays: 21, lastHours: 15, notes: [["Contraproposta do proprietário: R$ 4.150.000.", "nota", 15]] },
  { id: "l13", name: "Sofia Barros", phone: "5511991110013", ownerId: "b1", stage: "ganho", type: "Studio", min: 550_000, max: 650_000, beds: 1, hoods: ["Itaim Bibi"], interest: "p10", source: "Instagram", createdDays: 60, lastHours: 400, notes: [["Escritura assinada! 🎉", "nota", 400]] },
  { id: "l14", name: "Eduardo Pires", phone: "5511991110014", ownerId: "b2", stage: "ganho", type: "Apartamento", min: 800_000, max: 1_000_000, beds: 2, hoods: ["Vila Mariana"], source: "Site", createdDays: 75, lastHours: 600, notes: [["Venda concluída de imóvel de parceiro.", "nota", 600]] },
  { id: "l15", name: "Helena Duarte", phone: "5511991110015", ownerId: "b3", stage: "perdido", type: "Cobertura", min: 3_000_000, max: 3_500_000, beds: 3, hoods: ["Perdizes"], source: "Portal VivaReal", createdDays: 40, lastHours: 500, notes: [["Comprou com outra imobiliária.", "nota", 500]] },
  { id: "l16", name: "Marcos Teixeira", phone: "5511991110016", ownerId: "b1", stage: "contato", type: "Casa", min: 1_900_000, max: 2_200_000, beds: 3, hoods: ["Moema"], source: "Indicação", createdDays: 5, lastHours: 8, notes: [["Quer casa com quintal para cachorro.", "ligacao", 8]] },
];

const H = 3_600_000;

export function buildSeed(now = Date.now()) {
  const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
  const properties: Property[] = PROPS.map(({ daysAgo, ...p }) => ({
    ...p,
    city: "São Paulo",
    createdAt: iso(daysAgo * 24 * H),
  }));
  const leads: Lead[] = LEADS.map((s) => {
    const interactions: Interaction[] = s.notes.map(([text, kind, hoursAgo], i) => ({
      id: `${s.id}-i${i}`,
      kind,
      text,
      at: iso(hoursAgo * H),
      authorId: s.ownerId,
      scheduledFor: kind === "visita" && s.visitInDays ? new Date(now + s.visitInDays * 24 * H).toISOString() : undefined,
    }));
    return {
      id: s.id,
      name: s.name,
      phone: s.phone,
      email: `${s.name.split(" ")[0].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}@email.com`,
      ownerId: s.ownerId,
      stage: s.stage,
      propertyType: s.type,
      budgetMin: s.min,
      budgetMax: s.max,
      bedrooms: s.beds,
      neighborhoods: s.hoods,
      interestPropertyId: s.interest,
      source: s.source,
      createdAt: iso(s.createdDays * 24 * H),
      lastContactAt: iso(s.lastHours * H),
      interactions: interactions.reverse(),
    };
  });
  return { properties, leads };
}
