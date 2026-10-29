import { describe, expect, it } from "vitest";
import { parseLeadCSV } from "./import";

describe("parseLeadCSV", () => {
  it("parses valid CSV with comma or semicolon delimiter and normalizes fields", () => {
    const csv = `Nome,Telefone,Email,Tipo,OrcamentoMin,OrcamentoMax,Quartos,Bairros,Origem,Etapa
Carlos Silva,11988887777,carlos@example.com,Apartamento,500000,800000,2,Pinheiros;Vila Madalena,Site,novo
Ana Souza,11977776666,ana@example.com,Casa,1000000,1500000,3,Jardins,Instagram,contato`;

    const result = parseLeadCSV(csv, "b1");
    expect(result.errors).toHaveLength(0);
    expect(result.leads).toHaveLength(2);

    expect(result.leads[0]).toMatchObject({
      name: "Carlos Silva",
      phone: "5511988887777",
      email: "carlos@example.com",
      propertyType: "Apartamento",
      budgetMin: 500_000,
      budgetMax: 800_000,
      bedrooms: 2,
      neighborhoods: ["Pinheiros", "Vila Madalena"],
      source: "Site",
      stage: "novo",
      ownerId: "b1",
    });

    expect(result.leads[1]).toMatchObject({
      name: "Ana Souza",
      phone: "5511977776666",
      email: "ana@example.com",
      propertyType: "Casa",
      budgetMin: 1_000_000,
      budgetMax: 1_500_000,
      bedrooms: 3,
      neighborhoods: ["Jardins"],
      source: "Instagram",
      stage: "contato",
      ownerId: "b1",
    });
  });

  it("handles semicolon delimited CSV correctly", () => {
    const csv = `Nome;Telefone;Email;Tipo;OrcamentoMin;OrcamentoMax;Quartos;Bairros;Origem;Etapa
Mariana Costa;11966665555;mariana@example.com;Studio;300000;450000;1;Moema;Indicação;novo`;

    const result = parseLeadCSV(csv, "b2");
    expect(result.errors).toHaveLength(0);
    expect(result.leads).toHaveLength(1);
    expect(result.leads[0]?.name).toBe("Mariana Costa");
    expect(result.leads[0]?.phone).toBe("5511966665555");
    expect(result.leads[0]?.neighborhoods).toEqual(["Moema"]);
  });

  it("reports validation errors for missing name, invalid phone, or invalid budget", () => {
    const csv = `Nome,Telefone,Email,Tipo,OrcamentoMin,OrcamentoMax,Quartos,Bairros,Origem,Etapa
,11988887777,noname@example.com,Apartamento,500000,800000,2,Pinheiros,Site,novo
João Santos,abc,joao@example.com,Apartamento,800000,500000,2,Pinheiros,Site,novo
Maria Lima,11988887777,maria@example.com,InvalidoType,500000,800000,2,Pinheiros,Site,novo`;

    const result = parseLeadCSV(csv, "b1");
    expect(result.leads).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.errors.some(e => e.message.includes("Nome"))).toBe(true);
    expect(result.errors.some(e => e.message.includes("Telefone"))).toBe(true);
    expect(result.errors.some(e => e.message.includes("mínimo"))).toBe(true);
    expect(result.errors.some(e => e.message.includes("Tipo"))).toBe(true);
  });

  it("handles empty or malformed CSV gracefully", () => {
    const result = parseLeadCSV("", "b1");
    expect(result.leads).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
