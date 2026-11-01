export type City =
  | "São Pedro"
  | "Águas de São Pedro"
  | "Santa Maria da Serra"
  | "Charqueada"
  | "Piracicaba"
  | "Torrinha";

export const CITIES: City[] = [
  "São Pedro",
  "Águas de São Pedro",
  "Santa Maria da Serra",
  "Charqueada",
  "Piracicaba",
  "Torrinha",
];

export const DEFAULT_CITY: City = "São Pedro";

export const NEIGHBORHOODS_BY_CITY: Record<City, string[]> = {
  "São Pedro": [
    "Centro",
    "Alpes das Águas",
    "Colina de São Pedro",
    "Condomínio Serra Verde",
    "Jardim Botânico",
    "Jardim Itália",
    "Jardim Mariluz",
    "Nova São Pedro",
    "Recanto das Águas",
    "Santa Cruz",
    "São Dimas",
  ].sort((a, b) => a.localeCompare(b, "pt-BR")),
  "Águas de São Pedro": [
    "Centro",
    "Jardim Porangaba",
    "Setor Residencial",
    "Setor Universitário",
    "Zona de Expansão",
  ].sort((a, b) => a.localeCompare(b, "pt-BR")),
  "Santa Maria da Serra": [
    "Centro",
    "Cidade Jardim",
    "Jardim Bom Jesus",
    "Jardim Itália",
    "Jardim Levorato",
    "Jardim Santa Maria",
    "Serra Jardim",
    "Vila Dona Tidinha",
    "Área Rural / Região da Represa",
  ].sort((a, b) => a.localeCompare(b, "pt-BR")),
  Charqueada: [
    "Centro",
    "Alvorada",
    "Bela Vista",
    "Boa Vista",
    "Estância de Charqueada",
    "Jardim Bandeirantes",
    "Jardim GSP Life",
    "Jardim São Benedito",
    "Jardim Silvana",
    "Paraisolândia",
    "Parque das Nações",
    "Parque Residencial Paineiras",
    "Recreio",
    "Santa Luzia",
    "Serra Azul",
  ].sort((a, b) => a.localeCompare(b, "pt-BR")),
  Piracicaba: [
    "Centro",
    "Artemis",
    "Bairro Alto",
    "Dois Córregos",
    "Jupiá",
    "Nova Piracicaba",
    "Paulista",
    "Pauliceia",
    "Santa Teresinha",
    "São Dimas",
    "Vila Rezende",
  ].sort((a, b) => a.localeCompare(b, "pt-BR")),
  Torrinha: [
    "Centro",
    "Jardim das Orquídeas",
    "Jardim Primavera",
    "Jardim Solar",
    "Mundo Novo",
    "Vila Monte Alegre",
    "Vila Pinheiro",
    "Vila Santa Cecília",
    "Vila São José",
    "Área Rural / Região das Cachoeiras",
  ].sort((a, b) => a.localeCompare(b, "pt-BR")),
};

import { Property } from "./types";
import { normalizeText } from "./rules";

export function suggestNeighborhoods(city: City, properties: Property[]): string[] {
  const set = new Set<string>();
  const cityNeighborhoods = NEIGHBORHOODS_BY_CITY[city] || [];
  cityNeighborhoods.forEach((n) => set.add(n));

  properties.forEach((p) => {
    if (normalizeText(p.city) === normalizeText(city)) {
      if (p.neighborhood) set.add(p.neighborhood);
    }
  });

  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function canonicalNeighborhood(text: string, city: City): string {
  const norm = normalizeText(text);
  const cityNeighborhoods = NEIGHBORHOODS_BY_CITY[city] || [];
  const found = cityNeighborhoods.find((n) => normalizeText(n) === norm);
  return found || text.trim();
}
