import { createFileRoute } from "@tanstack/react-router";
import { Building2, Check, Crown, Lock, MapPin, Phone, Trophy, X } from "lucide-react";
import { PageHeader, LoadingBlock } from "@/components/crm/AppShell";
import { OPEN_STAGES, STAGES, brlCompact, formatPhone } from "@/lib/crm/rules";
import { AGENCY } from "@/lib/crm/seed";
import { useCrm } from "@/lib/crm/store";
import type { Lead, Property } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/imobiliaria")({
  head: () => ({
    meta: [
      { title: "Imobiliária e equipe — Morada CRM" },
      { name: "description", content: "Perfil da imobiliária, desempenho dos corretores e regras de permissão por papel." },
      { property: "og:title", content: "Imobiliária e equipe — Morada CRM" },
      { property: "og:description", content: "Visão do dono e do corretor: desempenho, funil e permissões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgencyPage,
});

function metrics(leads: Lead[], properties: Property[]) {
  const value = (l: Lead) => properties.find((p) => p.id === l.interestPropertyId)?.price ?? l.budgetMax;
  const won = leads.filter((l) => l.stage === "ganho");
  const lost = leads.filter((l) => l.stage === "perdido");
  const open = leads.filter((l) => OPEN_STAGES.includes(l.stage));
  const closed = won.length + lost.length;
  return {
    total: leads.length,
    open: open.length,
    visits: leads.filter((l) => l.stage === "visita").length,
    proposals: leads.filter((l) => l.stage === "proposta").length,
    won: won.length,
    conversion: closed ? Math.round((won.length / closed) * 100) : 0,
    vgvWon: won.reduce((s, l) => s + value(l), 0),
    pipeline: open.reduce((s, l) => s + value(l), 0),
  };
}

const PERMISSIONS = [
  { label: "Ver todos os leads da imobiliária", admin: true, broker: false },
  { label: "Ver e editar os próprios leads", admin: true, broker: true },
  { label: "Atribuir lead a outro corretor", admin: true, broker: false },
  { label: "Ranking e desempenho da equipe", admin: true, broker: false },
  { label: "Catálogo de imóveis e Smart Match", admin: true, broker: true },
  { label: "Cadastrar imóveis", admin: true, broker: true },
];

function AgencyPage() {
  const { ready, viewer, allLeads, leads, properties, brokers, currentBroker } = useCrm();
  if (!ready) return <LoadingBlock />;

  const isAdmin = viewer.kind === "admin";
  const m = metrics(leads, properties);
  const kpis = [
    { label: isAdmin ? "Leads totais" : "Meus leads", value: String(m.total) },
    { label: "Em negociação", value: String(m.open) },
    { label: "Taxa de conversão", value: `${m.conversion}%` },
    { label: "VGV fechado", value: brlCompact(m.vgvWon) },
    { label: "Pipeline aberto", value: brlCompact(m.pipeline) },
  ];

  return (
    <div className="pb-10">
      <PageHeader
        title={isAdmin ? "Visão da imobiliária" : "Meu perfil"}
        subtitle={isAdmin ? "Desempenho geral e equipe de corretores." : "Seus números e o que você pode acessar no CRM."}
        actions={
          realAdmin ? (
            <Link
              to="/equipe"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Users className="size-4" /> Gerenciar equipe
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-5 px-4 md:px-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Profile banner */}
          <div className="relative overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground">
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-sidebar-primary/15" />
            <div className="absolute -right-4 -bottom-20 size-40 rounded-full bg-sidebar-primary/10" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid size-16 place-items-center rounded-2xl bg-sidebar-primary font-display text-2xl font-bold text-sidebar-primary-foreground">
                {isAdmin ? <Building2 className="size-7" /> : currentBroker?.initials}
              </div>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-primary">
                  {isAdmin ? <><Crown className="size-3.5" /> Dono / Admin</> : "Corretor"}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-sidebar-accent-foreground">
                  {isAdmin ? AGENCY.name : currentBroker?.name}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sidebar-foreground/75">
                  <span>{isAdmin ? AGENCY.creci : currentBroker?.creci}</span>
                  <span className="flex items-center gap-1"><Phone className="size-3.5" />{formatPhone(isAdmin ? AGENCY.phone : currentBroker!.phone)}</span>
                  {isAdmin && <span className="flex items-center gap-1"><MapPin className="size-3.5" />{AGENCY.address}</span>}
                </div>
                {isAdmin && <p className="mt-2 text-sm text-sidebar-foreground/75">Responsável: {AGENCY.ownerName}</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border bg-card p-4 shadow-card">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="mt-1 whitespace-nowrap font-display text-xl font-bold xl:text-2xl">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Funnel distribution */}
          <div className="rounded-3xl border bg-card p-5">
            <h3 className="font-semibold">Distribuição do funil</h3>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
              {STAGES.map((s) => {
                const n = leads.filter((l) => l.stage === s.id).length;
                return n ? <div key={s.id} className={s.color} style={{ width: `${(n / leads.length) * 100}%` }} title={`${s.label}: ${n}`} /> : null;
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {STAGES.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className={cn("size-2.5 rounded-full", s.color)} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto font-semibold">{leads.filter((l) => l.stage === s.id).length}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Team ranking */}
          <div className="rounded-3xl border bg-card">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="flex items-center gap-2 font-semibold"><Trophy className="size-4 text-highlight-foreground" /> Ranking da equipe</h3>
              {!isAdmin && <span className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="size-3.5" /> Restrito ao admin</span>}
            </div>
            {isAdmin ? (
              <div className="divide-y">
                {brokers
                  .map((b) => ({ b, m: metrics(allLeads.filter((l) => l.ownerId === b.id), properties) }))
                  .sort((a, z) => z.m.vgvWon - a.m.vgvWon || z.m.pipeline - a.m.pipeline)
                  .map(({ b, m: bm }, i) => (
                    <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="w-4 text-sm font-bold text-muted-foreground">{i + 1}</span>
                      <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">{b.initials}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bm.open} em negociação · {bm.visits} visitas · {bm.proposals} propostas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold">{brlCompact(bm.vgvWon)}</p>
                        <p className="text-[11px] text-muted-foreground">{bm.won} vendas · {bm.conversion}%</p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="m-5 mt-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Lock className="mx-auto mb-2 size-5" />
                Como corretor, você não vê os clientes nem os números dos colegas.
                <br />Troque para “Dono/Admin” em “Simular como” para ver a visão geral.
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        <aside className="space-y-5">
          <div className="rounded-3xl border bg-card p-5">
            <h3 className="font-semibold">Regras de permissão</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Você está como <strong className="text-foreground">{isAdmin ? "Dono/Admin" : `Corretor (${currentBroker?.name})`}</strong>.
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-[1fr_56px_64px] bg-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Recurso</span><span className="text-center">Admin</span><span className="text-center">Corretor</span>
              </div>
              {PERMISSIONS.map((p) => (
                <div key={p.label} className="grid grid-cols-[1fr_56px_64px] items-center border-t px-3 py-2.5 text-sm">
                  <span>{p.label}</span>
                  <Mark ok={p.admin} active={isAdmin} />
                  <Mark ok={p.broker} active={!isAdmin} />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border bg-card p-5">
            <h3 className="font-semibold">Plano</h3>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-secondary p-4">
              <div>
                <p className="font-display text-lg font-bold">Morada Pro</p>
                <p className="text-xs text-muted-foreground">{brokers.length + 1} de 10 usuários · {properties.length} imóveis</p>
              </div>
              <span className="rounded-full bg-highlight px-2.5 py-1 text-xs font-bold text-highlight-foreground">Ativo</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Mark({ ok, active }: { ok: boolean; active: boolean }) {
  return (
    <span className="flex justify-center">
      <span
        className={cn(
          "grid size-6 place-items-center rounded-full",
          ok ? (active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary") : "bg-muted text-muted-foreground",
        )}
      >
        {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </span>
    </span>
  );
}
