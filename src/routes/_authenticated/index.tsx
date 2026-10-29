import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, Download, FileSignature, Search, Users } from "lucide-react";
import { PageHeader, LoadingBlock } from "@/components/crm/AppShell";
import { KanbanBoard } from "@/components/crm/KanbanBoard";
import { LeadDrawer } from "@/components/crm/LeadDrawer";
import { NewLeadDialog } from "@/components/crm/NewLeadDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OPEN_STAGES, brlCompact, contactUrgency } from "@/lib/crm/rules";
import { useCrm } from "@/lib/crm/store";
import { exportLeadsToCSV } from "@/lib/crm/export";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Funil de vendas — Morada CRM imobiliário" },
      {
        name: "description",
        content:
          "Quadro Kanban de oportunidades imobiliárias com arrastar e soltar, WhatsApp rápido e Smart Match de imóveis.",
      },
      { property: "og:title", content: "Funil de vendas — Morada CRM imobiliário" },
      {
        property: "og:description",
        content:
          "Acompanhe leads do primeiro contato ao fechamento e envie imóveis compatíveis pelo WhatsApp.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FunnelPage,
});

function FunnelPage() {
  const { ready, leads, viewer, brokers, currentBroker } = useCrm();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [broker, setBroker] = useState<string>("all");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (viewer.kind !== "admin" || broker === "all" || l.ownerId === broker) &&
        (!term ||
          l.name.toLowerCase().includes(term) ||
          l.neighborhoods.some((n) => n.toLowerCase().includes(term))),
    );
  }, [leads, q, broker, viewer.kind]);

  const open = filtered.filter((l) => OPEN_STAGES.includes(l.stage));
  const kpis = [
    { label: "Leads ativos", value: String(open.length), icon: Users },
    {
      label: "Visitas agendadas",
      value: String(filtered.filter((l) => l.stage === "visita").length),
      icon: CalendarClock,
    },
    {
      label: "Em proposta",
      value: brlCompact(
        filtered.filter((l) => l.stage === "proposta").reduce((s, l) => s + l.budgetMax, 0),
      ),
      icon: FileSignature,
    },
    {
      label: "Sem contato 7d+",
      value: String(open.filter((l) => contactUrgency(l.lastContactAt) === "late").length),
      icon: AlertTriangle,
      alert: true,
    },
  ];

  return (
    <div>
      <PageHeader
        title={
          viewer.kind === "admin"
            ? "Funil da imobiliária"
            : `Funil de ${currentBroker?.name.split(" ")[0]}`
        }
        subtitle={
          viewer.kind === "admin"
            ? "Visão geral de todos os corretores. Arraste os cards entre as etapas."
            : "Você está vendo apenas os seus clientes."
        }
        actions={
          <div className="flex gap-2">
            {viewer.kind === "admin" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportLeadsToCSV(filtered)}
              >
                <Download className="mr-2 size-4" /> Exportar CSV
              </Button>
            )}
            <NewLeadDialog onCreated={setOpenId} />
          </div>
        }
      />

      {!ready ? (
        <LoadingBlock />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 px-4 md:grid-cols-4 md:px-8">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border bg-card p-3.5 shadow-card">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <k.icon className={cn("size-3.5", k.alert && "text-destructive")} />
                  {k.label}
                </div>
                <p className="mt-1.5 font-display text-xl font-bold md:text-2xl">{k.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 px-4 pt-5 pb-4 md:flex-row md:items-center md:px-8">
            <div className="relative md:w-72">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar cliente ou bairro"
                className="h-10 rounded-full bg-card pl-9"
              />
            </div>
            {viewer.kind === "admin" && (
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {[{ id: "all", name: "Todos" }, ...brokers].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBroker(b.id)}
                    className={cn(
                      "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition",
                      broker === b.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card hover:border-primary/40",
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <KanbanBoard leads={filtered} onOpen={setOpenId} />
          <LeadDrawer leadId={openId} onClose={() => setOpenId(null)} />
        </>
      )}
    </div>
  );
}
