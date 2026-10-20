import { describe, expect, it } from "vitest";
import { buildSeed } from "./seed";
import { contactUrgency, smartMatch, visibleLeads, waLink } from "./rules";
import type { Lead } from "./types";

const { leads, properties } = buildSeed(Date.UTC(2026, 0, 15));

describe("permissões por papel", () => {
  it("corretor vê apenas os próprios clientes", () => {
    const mine = visibleLeads(leads, { kind: "broker", brokerId: "b1" });
    expect(mine.length).toBeGreaterThan(0);
    expect(mine.every((l) => l.ownerId === "b1")).toBe(true);
    expect(mine.length).toBeLessThan(leads.length);
  });

  it("dono/admin tem visão geral de todos os leads", () => {
    expect(visibleLeads(leads, { kind: "admin" })).toHaveLength(leads.length);
  });
});

describe("smart match", () => {
  const base: Lead = { ...leads[0], propertyType: "Apartamento", budgetMin: 1_100_000, budgetMax: 1_500_000, neighborhoods: ["Pinheiros"] };

  it("prioriza imóvel com tipo, orçamento e bairro compatíveis", () => {
    const [top] = smartMatch(base, properties);
    expect(top.property.id).toBe("p1");
    expect(top.score).toBe(100);
  });

  it("ignora imóveis vendidos", () => {
    const studioLead: Lead = { ...base, propertyType: "Studio", budgetMin: 550_000, budgetMax: 650_000, neighborhoods: ["Itaim Bibi"] };
    expect(smartMatch(studioLead, properties).some((m) => m.property.id === "p10")).toBe(false);
  });

  it("aceita até 10% acima do orçamento máximo, não mais", () => {
    const lead: Lead = { ...base, budgetMin: 1_000_000, budgetMax: 1_350_000 }; // p1 = 1.48mi (9.6% acima)
    expect(smartMatch(lead, properties).find((m) => m.property.id === "p1")?.reasons.budget).toBe(true);
    const tight: Lead = { ...base, budgetMin: 1_000_000, budgetMax: 1_300_000 }; // 13.8% acima
    expect(smartMatch(tight, properties).find((m) => m.property.id === "p1")?.reasons.budget).toBeFalsy();
  });
});

describe("whatsapp e urgência", () => {
  it("gera link wa.me com DDI 55 e texto codificado", () => {
    expect(waLink("(11) 99111-0001", "Olá João")).toBe("https://wa.me/5511991110001?text=Ol%C3%A1%20Jo%C3%A3o");
  });

  it("marca contato atrasado a partir de 7 dias", () => {
    const now = Date.UTC(2026, 0, 15);
    expect(contactUrgency(new Date(now - 2 * 86_400_000).toISOString(), now)).toBe("ok");
    expect(contactUrgency(new Date(now - 3 * 86_400_000).toISOString(), now)).toBe("warn");
    expect(contactUrgency(new Date(now - 7 * 86_400_000).toISOString(), now)).toBe("late");
  });
});
