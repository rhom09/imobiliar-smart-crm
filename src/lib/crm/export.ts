import type { Lead } from "./types";

export function exportLeadsToCSV(leads: Lead[]) {
  const headers = [
    "Nome",
    "Telefone",
    "Email",
    "Etapa",
    "Tipo de Imóvel",
    "Orçamento Mínimo",
    "Orçamento Máximo",
    "Data de Criação",
  ];

  const rows = leads.map((lead) => [
    `"${lead.name.replace(/"/g, '""')}"`,
    `"${lead.phone}"`,
    `"${lead.email}"`,
    `"${lead.stage}"`,
    `"${lead.propertyType}"`,
    lead.budgetMin,
    lead.budgetMax,
    lead.createdAt,
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const blob = new Blob(["﻿" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `leads_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
