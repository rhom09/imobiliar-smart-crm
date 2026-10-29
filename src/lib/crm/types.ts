export type StageId = "novo" | "contato" | "visita" | "proposta" | "ganho" | "perdido";

export type PropertyType =
  "Apartamento" | "Casa" | "Cobertura" | "Studio" | "Sobrado" | "Comercial";

export type Broker = {
  id: string;
  name: string;
  phone: string;
  creci: string;
  initials: string;
};

/** Who the user is simulating. Admin sees everything; broker sees only own leads. */
export type Viewer = { kind: "admin" } | { kind: "broker"; brokerId: string };

export type InteractionKind = "nota" | "ligacao" | "whatsapp" | "visita" | "etapa";

export type Interaction = {
  id: string;
  kind: InteractionKind;
  text: string;
  at: string; // ISO
  scheduledFor?: string | undefined; // ISO, for visits
  authorId: string; // broker id or "admin"
};

export type Lead = {
  id: string;
  name: string;
  phone: string; // digits with country code, e.g. 5511987654321
  email: string;
  ownerId: string; // broker id
  stage: StageId;
  propertyType: PropertyType;
  budgetMin: number;
  budgetMax: number;
  bedrooms: number;
  neighborhoods: string[];
  interestPropertyId?: string | undefined;
  source: string;
  createdAt: string;
  lastContactAt: string;
  interactions: Interaction[];
};

export type PropertyStatus = "disponivel" | "reservado" | "vendido";

export type Property = {
  id: string;
  code: string;
  title: string;
  type: PropertyType;
  price: number;
  neighborhood: string;
  city: string;
  address: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking: number;
  area: number;
  condo: number;
  iptu: number;
  description: string;
  features: string[];
  photos: string[]; // asset keys ("asset:living") or data/https URLs
  brokerId: string;
  status: PropertyStatus;
  createdAt: string;
};

export type Agency = {
  name: string;
  creci: string;
  city: string;
  address: string;
  phone: string;
  ownerName: string;
};
