import type { Lead, PropertyType, StageId } from "./types";
import { normalizePhone, PROPERTY_TYPES, STAGES } from "./rules";

export type ImportLeadResult = {
  leads: Omit<Lead, "id" | "createdAt" | "lastContactAt" | "interactions">[];
  errors: { row: number; message: string }[];
};

const VALID_STAGES: StageId[] = STAGES.map((s) => s.id);

export function parseLeadCSV(csvText: string, defaultOwnerId: string): ImportLeadResult {
  const errors: { row: number; message: string }[] = [];
  const leads: Omit<Lead, "id" | "createdAt" | "lastContactAt" | "interactions">[] = [];

  if (!csvText || !csvText.trim()) {
    return { leads, errors: [{ row: 0, message: "Arquivo CSV vazio." }] };
  }

  const lines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { leads, errors: [{ row: 0, message: "O arquivo CSV precisa de uma linha de cabeçalho e ao menos uma linha de dados." }] };
  }

  const headerLine = lines[0]!;
  const delimiter = headerLine.includes(";") ? ";" : ",";

  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));

  const getColIndex = (candidates: string[]) => {
    for (const c of candidates) {
      const idx = headers.indexOf(c);
      if (idx !== -1) return idx;
    }
    for (const c of candidates) {
      const idx = headers.findIndex((h) => h.includes(c));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxName = getColIndex(["nome", "name"]);
  const idxPhone = getColIndex(["telefone", "celular", "phone", "whatsapp"]);
  const idxEmail = getColIndex(["email", "e-mail"]);
  const idxType = getColIndex(["tipo", "propertytype", "imovel"]);
  const idxBudgetMin = getColIndex(["orcamentomin", "valormin", "precomin"]);
  const idxBudgetMax = getColIndex(["orcamentomax", "valormax", "precomax", "orcamento"]);
  const idxBedrooms = getColIndex(["quartos", "dormitorios", "bedrooms"]);
  const idxNeighborhoods = getColIndex(["bairros", "bairro", "regiao", "neighborhoods"]);
  const idxSource = getColIndex(["origem", "source", "canal"]);
  const idxStage = getColIndex(["etapa", "stage", "status"]);

  if (idxName === -1 || idxPhone === -1) {
    return {
      leads,
      errors: [{ row: 1, message: "Cabeçalho inválido: colunas obrigatórias 'Nome' e 'Telefone' não encontradas." }],
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const rowNum = i + 1;
    const cols = parseCSVRow(line, delimiter);

    const name = cols[idxName]?.trim() ?? "";
    const rawPhone = cols[idxPhone]?.trim() ?? "";
    const email = cols[idxEmail]?.trim() ?? "";
    const typeStr = cols[idxType]?.trim() ?? "Apartamento";
    const minStr = idxBudgetMin !== -1 ? cols[idxBudgetMin]?.trim() ?? "" : "";
    const maxStr = idxBudgetMax !== -1 ? cols[idxBudgetMax]?.trim() ?? "" : "";
    const bedStr = idxBedrooms !== -1 ? cols[idxBedrooms]?.trim() ?? "1" : "1";
    const neighborhoodsStr = idxNeighborhoods !== -1 ? cols[idxNeighborhoods]?.trim() ?? "" : "";
    const sourceStr = idxSource !== -1 ? cols[idxSource]?.trim() ?? "Importação CSV" : "Importação CSV";
    const stageStr = idxStage !== -1 ? (cols[idxStage]?.trim().toLowerCase() ?? "novo") as StageId : "novo";

    const rowErrors: string[] = [];

    if (!name) {
      rowErrors.push("Nome obrigatório em branco.");
    }

    const phoneDigits = rawPhone.replace(/\D/g, "");
    if (!phoneDigits || phoneDigits.length < 10) {
      rowErrors.push(`Telefone inválido ('${rawPhone}').`);
    }

    const budgetMin = minStr ? (Number(minStr.replace(/\D/g, "")) || 0) : 0;
    const budgetMax = maxStr ? (Number(maxStr.replace(/\D/g, "")) || 0) : 0;

    if (budgetMin > 0 && budgetMax > 0 && budgetMin > budgetMax) {
      rowErrors.push("Orçamento mínimo não pode ser maior que o máximo.");
    }

    if (typeStr && !(PROPERTY_TYPES as readonly string[]).includes(typeStr)) {
      rowErrors.push(`Tipo de imóvel inválido ('${typeStr}').`);
    }

    const propertyType = (PROPERTY_TYPES as readonly string[]).includes(typeStr)
      ? (typeStr as PropertyType)
      : "Apartamento";

    const bedrooms = parseInt(bedStr, 10);
    const validBedrooms = isNaN(bedrooms) || bedrooms < 0 ? 1 : bedrooms;

    const neighborhoods = neighborhoodsStr
      ? neighborhoodsStr.split(/[;,]/).map((n) => n.trim()).filter(Boolean)
      : ["Pinheiros"];

    const stage: StageId = VALID_STAGES.includes(stageStr) ? stageStr : "novo";

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join(" ") });
      continue;
    }

    leads.push({
      name,
      phone: normalizePhone(rawPhone),
      email: email || `${phoneDigits}@lead.morada.com`,
      ownerId: defaultOwnerId,
      stage,
      propertyType,
      budgetMin: budgetMin || 300_000,
      budgetMax: budgetMax || (budgetMin ? budgetMin * 1.3 : 800_000),
      bedrooms: validBedrooms,
      neighborhoods,
      source: sourceStr || "Importação CSV",
    });
  }

  return { leads, errors };
}

function parseCSVRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      if (inQuotes && row[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result.map((s) => s.trim().replace(/^["'](.*)["']$/, "$1"));
}
