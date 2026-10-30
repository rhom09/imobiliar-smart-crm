import { createFileRoute, Link } from '@tanstack/react-router';
import { useRef, useState } from "react";
import { Building2, Check, Crown, Edit2, ImagePlus, Lock, MapPin, Phone, Trophy, Users, X } from "lucide-react";
import { PageHeader, LoadingBlock } from "@/components/crm/AppShell";
import { OPEN_STAGES, STAGES, brlCompact, formatPhone } from "@/lib/crm/rules";
import { useCrm } from "@/lib/crm/store";
import type { Lead, Property, StageId } from "@/lib/crm/types";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadPhoto } from "@/components/crm/PropertyForm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/imobiliaria")({
  head: () => ({
    meta: [
      { title: "Imobiliária e equipe — Morada CRM" },
      {
        name: "description",
        content:
          "Perfil da imobiliária, desempenho dos corretores e regras de permissão por papel.",
      },
      { property: "og:title", content: "Imobiliária e equipe — Morada CRM" },
      {
        property: "og:description",
        content: "Visão do dono e do corretor: desempenho, funil e permissões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgencyPage,
});

function metrics(leads: Lead[], properties: Property[]) {
  const value = (l: Lead) =>
    properties.find((p) => p.id === l.interestPropertyId)?.price ?? l.budgetMax;
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
  const {
    ready,
    viewer,
    allLeads,
    leads,
    properties,
    brokers,
    currentBroker,
    isAdmin: realAdmin,
    me,
    agency,
    updateProfile,
    updateAgency,
  } = useCrm();

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editAgencyOpen, setEditAgencyOpen] = useState(false);
  const [editTemplatesOpen, setEditTemplatesOpen] = useState(false);

  const [activeUser] = useState(() => brokers.find((b) => b.id === me?.id) || currentBroker || { name: "", phone: "", creci: "" });
  const [profileName, setProfileName] = useState(activeUser.name);
  const [profilePhone, setProfilePhone] = useState(activeUser.phone);
  const [profileCreci, setProfileCreci] = useState(activeUser.creci);

  const [agencyName, setAgencyName] = useState(agency.name);
  const [agencyCreci, setAgencyCreci] = useState(agency.creci);
  const [agencyCity, setAgencyCity] = useState(agency.city);
  const [agencyAddress, setAgencyAddress] = useState(agency.address);
  const [agencyPhone, setAgencyPhone] = useState(agency.phone);
  const [agencyOwnerName, setAgencyOwnerName] = useState(agency.ownerName);
  const [agencyLogoUrl, setAgencyLogoUrl] = useState(agency.logoUrl || "");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { whatsappTemplates, updateTemplate } = useCrm();
  const [templateDrafts, setTemplateDrafts] = useState(whatsappTemplates);

  if (!ready) return <LoadingBlock />;

  const isAdmin = viewer.kind === "admin";

  const handleSaveTemplates = async () => {
    for (const [stageId, text] of Object.entries(templateDrafts)) {
      await updateTemplate(stageId as StageId, text);
    }
    setEditTemplatesOpen(false);
  };
  const m = metrics(leads, properties);
  const kpis = [
    { label: isAdmin ? "Leads totais" : "Meus leads", value: String(m.total) },
    { label: "Em negociação", value: String(m.open) },
    { label: "Taxa de conversão", value: `${m.conversion}%` },
    { label: "VGV fechado", value: brlCompact(m.vgvWon) },
    { label: "Pipeline aberto", value: brlCompact(m.pipeline) },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me?.id) return;
    const ok = await updateProfile(me.id, {
      name: profileName,
      phone: profilePhone,
      creci: profileCreci,
    });
    if (ok) setEditProfileOpen(false);
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      name: agencyName,
      creci: agencyCreci,
      city: agencyCity,
      address: agencyAddress,
      phone: agencyPhone,
      ownerName: agencyOwnerName,
    };
    if (agencyLogoUrl) {
      payload["logoUrl"] = agencyLogoUrl;
    }
    const ok = await updateAgency(payload as any);
    if (ok) setEditAgencyOpen(false);
  };

  return (
    <div className="pb-10">
      <PageHeader
        title={isAdmin ? "Visão da imobiliária" : "Meu perfil"}
        subtitle={
          isAdmin
            ? "Desempenho geral e equipe de corretores."
            : "Seus números e o que você pode acessar no CRM."
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setProfileName(currentBroker?.name || "");
                setProfilePhone(currentBroker?.phone || "");
                setProfileCreci(currentBroker?.creci || "");
                setEditProfileOpen(true);
              }}
              className="gap-2 rounded-xl"
            >
              <Edit2 className="size-4" /> Editar meu perfil
            </Button>
            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTemplateDrafts(whatsappTemplates);
                    setEditTemplatesOpen(true);
                  }}
                  className="gap-2 rounded-xl"
                >
                  Templates WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAgencyName(agency.name);
                    setAgencyCreci(agency.creci);
                    setAgencyCity(agency.city);
                    setAgencyAddress(agency.address);
                    setAgencyPhone(agency.phone);
                    setAgencyOwnerName(agency.ownerName);
                    setAgencyLogoUrl(agency.logoUrl || "");
                    setEditAgencyOpen(true);
                  }}
                  className="gap-2 rounded-xl"
                >
                  <Building2 className="size-4" /> Editar imobiliária
                </Button>
              </>
            )}
            {realAdmin && (
              <Link
                to="/equipe"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                <Users className="size-4" /> Gerenciar equipe
              </Link>
            )}
          </div>
        }
      />

      <div className="grid gap-5 px-4 md:px-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Profile banner */}
          <div className="relative overflow-hidden rounded-3xl bg-sidebar p-6 text-sidebar-foreground">
            <div className="absolute -top-16 -right-16 size-56 rounded-full bg-sidebar-primary/15" />
            <div className="absolute -right-4 -bottom-20 size-40 rounded-full bg-sidebar-primary/10" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid size-16 place-items-center rounded-2xl bg-sidebar-primary font-display text-2xl font-bold text-sidebar-primary-foreground overflow-hidden">
                {isAdmin && agency?.logoUrl ? (
                  <img src={agency.logoUrl} alt={agency.name} className="size-full object-cover" />
                ) : isAdmin ? (
                  <Building2 className="size-7" />
                ) : (
                  currentBroker?.initials
                )}
              </div>
              <div className="flex-1">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-sidebar-primary">
                  {isAdmin ? (
                    <>
                      <Crown className="size-3.5" /> Dono / Admin
                    </>
                  ) : (
                    "Corretor"
                  )}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-sidebar-accent-foreground">
                  {isAdmin ? agency.name : currentBroker?.name}
                </h2>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sidebar-foreground/75">
                  <span>{isAdmin ? agency.creci : currentBroker?.creci}</span>
                  <span className="flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {formatPhone(isAdmin ? agency.phone : currentBroker!.phone)}
                  </span>
                  {isAdmin && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {agency.address}
                    </span>
                  )}
                </div>
                {isAdmin && (
                  <p className="mt-2 text-sm text-sidebar-foreground/75">
                    Responsável: {agency.ownerName}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl border bg-card p-4 shadow-card">
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="mt-1 whitespace-nowrap font-display text-xl font-bold xl:text-2xl">
                  {k.value}
                </p>
              </div>
            ))}
          </div>

          {/* Funnel distribution */}
          <div className="rounded-3xl border bg-card p-5">
            <h3 className="font-semibold">Distribuição do funil</h3>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted">
              {STAGES.map((s) => {
                const n = leads.filter((l) => l.stage === s.id).length;
                return n ? (
                  <div
                    key={s.id}
                    className={s.color}
                    style={{ width: `${(n / leads.length) * 100}%` }}
                    title={`${s.label}: ${n}`}
                  />
                ) : null;
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {STAGES.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className={cn("size-2.5 rounded-full", s.color)} />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto font-semibold">
                    {leads.filter((l) => l.stage === s.id).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Team ranking */}
          <div className="rounded-3xl border bg-card">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <Trophy className="size-4 text-highlight-foreground" /> Ranking da equipe
              </h3>
              {!isAdmin && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="size-3.5" /> Restrito ao admin
                </span>
              )}
            </div>
            {isAdmin ? (
              <div className="divide-y">
                {brokers
                  .map((b) => ({
                    b,
                    m: metrics(
                      allLeads.filter((l) => l.ownerId === b.id),
                      properties,
                    ),
                  }))
                  .sort((a, z) => z.m.vgvWon - a.m.vgvWon || z.m.pipeline - a.m.pipeline)
                  .map(({ b, m: bm }, i) => (
                    <div key={b.id} className="flex items-center gap-3 px-5 py-3.5">
                      <span className="w-4 text-sm font-bold text-muted-foreground">{i + 1}</span>
                      <span className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {b.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{b.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bm.open} em negociação · {bm.visits} visitas · {bm.proposals} propostas
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold">{brlCompact(bm.vgvWon)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {bm.won} vendas · {bm.conversion}%
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="m-5 mt-2 rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                <Lock className="mx-auto mb-2 size-5" />
                Como corretor, você não vê os clientes nem os números dos colegas.
                <br />
                Troque para “Dono/Admin” em “Simular como” para ver a visão geral.
              </div>
            )}
          </div>
        </div>

        {/* Permissions */}
        <aside className="space-y-5">
          <div className="rounded-3xl border bg-card p-5">
            <h3 className="font-semibold">Regras de permissão</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Você está como{" "}
              <strong className="text-foreground">
                {isAdmin ? "Dono/Admin" : `Corretor (${currentBroker?.name})`}
              </strong>
              .
            </p>
            <div className="mt-4 overflow-hidden rounded-2xl border">
              <div className="grid grid-cols-[1fr_56px_64px] bg-muted px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Recurso</span>
                <span className="text-center">Admin</span>
                <span className="text-center">Corretor</span>
              </div>
              {PERMISSIONS.map((p) => (
                <div
                  key={p.label}
                  className="grid grid-cols-[1fr_56px_64px] items-center border-t px-3 py-2.5 text-sm"
                >
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
                <p className="text-xs text-muted-foreground">
                  {brokers.length + 1} de 10 usuários · {properties.length} imóveis
                </p>
              </div>
              <span className="rounded-full bg-highlight px-2.5 py-1 text-xs font-bold text-highlight-foreground">
                Ativo
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar meu perfil</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="profile-name">Nome completo</Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="profile-phone">Telefone / WhatsApp</Label>
              <Input
                id="profile-phone"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="profile-creci">CRECI</Label>
              <Input
                id="profile-creci"
                value={profileCreci}
                onChange={(e) => setProfileCreci(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditProfileOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Agency Dialog */}
      <Dialog open={editAgencyOpen} onOpenChange={setEditAgencyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar dados da imobiliária</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveAgency} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="agency-name">Nome da imobiliária</Label>
              <Input
                id="agency-name"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="agency-creci">CRECI Jurídico</Label>
              <Input
                id="agency-creci"
                value={agencyCreci}
                onChange={(e) => setAgencyCreci(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="agency-city">Cidade / Estado</Label>
                <Input
                  id="agency-city"
                  value={agencyCity}
                  onChange={(e) => setAgencyCity(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="agency-phone">Telefone / WhatsApp</Label>
                <Input
                  id="agency-phone"
                  value={agencyPhone}
                  onChange={(e) => setAgencyPhone(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="agency-address">Endereço</Label>
              <Input
                id="agency-address"
                value={agencyAddress}
                onChange={(e) => setAgencyAddress(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="agency-owner">Responsável / Dono</Label>
              <Input
                id="agency-owner"
                value={agencyOwnerName}
                onChange={(e) => setAgencyOwnerName(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="agency-logo">Logo da Imobiliária</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl border bg-muted overflow-hidden">
                  {agencyLogoUrl ? (
                    <img src={agencyLogoUrl} alt="Logo" className="size-full object-cover" />
                  ) : (
                    <Building2 className="size-8 text-muted-foreground" />
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="gap-2"
                >
                  <ImagePlus className="size-4" />
                  {uploadingLogo ? "Enviando..." : "Alterar logo"}
                </Button>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingLogo(true);
                    try {
                      const url = await uploadPhoto(file, 400);
                      setAgencyLogoUrl(url);
                    } catch (err) {
                      toast.error("Erro ao enviar logo");
                    } finally {
                      setUploadingLogo(false);
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditAgencyOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar imobiliária</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit WhatsApp Templates Dialog */}
      <Dialog open={editTemplatesOpen} onOpenChange={setEditTemplatesOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Templates de Mensagem de WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              Personalize as mensagens rápidas enviadas aos clientes em cada etapa do funil. Você pode usar variáveis como o nome do lead.
            </p>
            {STAGES.map((s) => (
              <div key={s.id} className="space-y-1.5">
                <Label htmlFor={`template-${s.id}`} className="flex items-center gap-2">
                  <span className={cn("size-2 rounded-full", s.color)} />
                  Etapa: {s.label}
                </Label>
                <textarea
                  id={`template-${s.id}`}
                  value={templateDrafts[s.id as StageId] || ""}
                  onChange={(e) =>
                    setTemplateDrafts((prev) => ({ ...prev, [s.id as StageId]: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            ))}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditTemplatesOpen(false)}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSaveTemplates}>
                Salvar templates
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Mark({ ok, active }: { ok: boolean; active: boolean }) {
  return (
    <span className="flex justify-center">
      <span
        className={cn(
          "grid size-6 place-items-center rounded-full",
          ok
            ? active
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground",
        )}
      >
        {ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </span>
    </span>
  );
}

