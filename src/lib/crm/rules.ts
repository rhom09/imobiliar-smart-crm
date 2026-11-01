import type { Broker, Lead, Property, StageId, Viewer } from "./types";

export const STAGES: { id: StageId; label: string; short: string; color: string }[] = [
  { id: "novo", label: "Novo Lead", short: "Novo", color: "bg-stage-new" },
  { id: "contato", label: "Contato Feito", short: "Contato", color: "bg-stage-contact" },
  { id: "visita", label: "Visita Agendada", short: "Visita", color: "bg-stage-visit" },
  { id: "proposta", label: "Proposta Enviada", short: "Proposta", color: "bg-stage-proposal" },
  { id: "ganho", label: "Fechado (Ganho)", short: "Ganho", color: "bg-stage-won" },
  { id: "perdido", label: "Perdido", short: "Perdido", color: "bg-stage-lost" },
];

export const OPEN_STAGES: StageId[] = ["novo", "contato", "visita", "proposta"];

export const CITIES = [
  "São Pedro",
  "Águas de São Pedro",
  "Santa Maria da Serra",
  "Charqueada",
  "Piracicaba",
  "Torrinha",
];

export const NEIGHBORHOODS = [
  "Centro",
  "Vila Nova",
  "São Dimas",
  "Estância",
  "Jardim Italcam",
  "Recanto das Aguas",
  "Porto",
  "Algodoal",
];

export const PROPERTY_TYPES = [
  "Apartamento",
  "Casa",
  "Cobertura",
  "Studio",
  "Sobrado",
  "Comercial",
  "Terreno",
  "Chácara",
  "Sítio",
  "Galpão",
  "Loja",
] as const;

export function normalizeText(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
}

export function stageLabel(id: StageId) {
  return STAGES.find((s) => s.id === id)?.label ?? id;
}

/** Permission rule: admins see every lead; a broker sees only leads they own. */
export function visibleLeads(leads: Lead[], viewer: Viewer): Lead[] {
  if (viewer.kind === "admin") return leads;
  return leads.filter((l) => l.ownerId === viewer.brokerId);
}

export function canSeeLead(lead: Lead, viewer: Viewer) {
  return viewer.kind === "admin" || lead.ownerId === viewer.brokerId;
}

export type MatchResult = {
  property: Property;
  score: number;
  reasons: { type: boolean; budget: boolean; neighborhood: boolean };
};

/** Price tolerance above the lead's max budget still considered compatible (10%). */
export const BUDGET_TOLERANCE = 0.1;

/**
 * Smart Match: cross-references budget, property type, city and neighborhood.
 * Weights: type 40, budget 40, neighborhood/city 20. A property is compatible when it
 * scores at least 60 (i.e. it must hit budget or type plus one other criterion)
 * and is not sold. Results are sorted by score, then price closeness.
 */
export function smartMatch(lead: Lead, properties: Property[]): MatchResult[] {
  const target = (lead.budgetMin + lead.budgetMax) / 2;
  const leadCitiesNorm = (lead.cities ?? []).map(normalizeText);
  const leadHoodsNorm = (lead.neighborhoods ?? []).map(normalizeText);

  return properties
    .filter((p) => {
      if (p.status === "vendido") return false;
      if (leadCitiesNorm.length > 0) {
        if (!leadCitiesNorm.includes(normalizeText(p.city))) return false;
      }
      return true;
    })
    .map((p) => {
      const type = p.type === lead.propertyType;
      const budget =
        p.price <= lead.budgetMax * (1 + BUDGET_TOLERANCE) && p.price >= lead.budgetMin * 0.8;

      const pHoodNorm = normalizeText(p.neighborhood);
      const pCityNorm = normalizeText(p.city);

      let neighborhood = false;
      if (leadHoodsNorm.length > 0) {
        neighborhood = leadHoodsNorm.includes(pHoodNorm);
      } else if (leadCitiesNorm.length > 0) {
        neighborhood = leadCitiesNorm.includes(pCityNorm);
      } else {
        neighborhood = false;
      }

      const score = (type ? 40 : 0) + (budget ? 40 : 0) + (neighborhood ? 20 : 0);
      return { property: p, score, reasons: { type, budget, neighborhood } };
    })
    .filter((m) => m.score >= 60)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Math.abs(a.property.price - target) - Math.abs(b.property.price - target),
    );
}

export const brl = (n: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(n);

export const brlCompact = (n: number) => {
  if (n >= 1_000_000)
    return `R$ ${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi`;
  if (n >= 1_000) return `R$ ${Math.round(n / 1_000).toLocaleString("pt-BR")} mil`;
  return brl(n);
};

export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function normalizePhone(input: string) {
  const d = input.replace(/\D/g, "");
  return d.startsWith("55") ? d : `55${d}`;
}

export function waLink(phone: string, text: string) {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(text)}`;
}

/** Message tailored to the lead's funnel stage. */
export function contextualMessage(lead: Lead, broker: Broker | undefined, property?: Property) {
  const first = lead.name.split(" ")[0];
  const me = broker ? `${broker.name.split(" ")[0]}, da Morada Imóveis` : "da Morada Imóveis";
  const locationFallback = lead.neighborhoods[0] ?? lead.cities[0] ?? "São Pedro";
  const imovel = property
    ? `o ${property.title} em ${property.neighborhood}`
    : `${article(lead.propertyType)} ${lead.propertyType.toLowerCase()} em ${locationFallback}`;
  switch (lead.stage) {
    case "novo":
      return `Olá, ${first}! Aqui é ${me}. Vi seu interesse em ${imovel} e separei algumas opções dentro de ${brlCompact(lead.budgetMax)}. Posso te enviar?`;
    case "contato":
      return `Oi, ${first}! Tudo bem? Seguindo nossa conversa sobre ${imovel}, que tal agendarmos uma visita esta semana?`;
    case "visita":
      return `Oi, ${first}! Passando para confirmar nossa visita ao ${property ? property.title : "imóvel"}. Qualquer imprevisto me avise por aqui.`;
    case "proposta":
      return `Oi, ${first}! Conseguiu avaliar a proposta para ${imovel}? Estou à disposição para tirar dúvidas e negociar condições.`;
    case "ganho":
      return `${first}, parabéns pela conquista do novo imóvel! Foi um prazer te atender. Conte comigo para o que precisar.`;
    case "perdido":
      return `Oi, ${first}! Surgiram novas opções de ${lead.propertyType.toLowerCase()} na sua faixa de ${brlCompact(lead.budgetMax)}. Quer dar uma olhada?`;
  }
}

function article(type: string) {
  return type === "Casa" || type === "Cobertura" || type === "Chácara" ? "uma" : "um";
}

export function propertySheet(p: Property, url: string) {
  return [
    `🏡 *${p.title}*`,
    `📍 ${p.neighborhood}, ${p.city}`,
    `💰 ${brl(p.price)}`,
    `🛏 ${p.bedrooms} quartos (${p.suites} suítes) · 🚿 ${p.bathrooms} banheiros · 🚗 ${p.parking} vagas`,
    `📐 ${p.area} m²${p.condo ? ` · Condomínio ${brl(p.condo)}` : ""}`,
    "",
    `Ver fotos e detalhes: ${url}`,
  ].join("\n");
}

export function daysSince(iso: string, now = Date.now()) {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

/** Visual urgency of the last contact: ok (<3d), warn (3-6d), late (7d+). */
export function contactUrgency(iso: string, now = Date.now()): "ok" | "warn" | "late" {
  const d = daysSince(iso, now);
  if (d >= 7) return "late";
  if (d >= 3) return "warn";
  return "ok";
}
