import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowRightLeft,
  BedDouble,
  CalendarClock,
  Check,
  Copy,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Sparkles,
  StickyNote,
  Wallet,
  Home,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { timeAgo } from "./LeadCard";
import {
  STAGES,
  brl,
  contextualMessage,
  formatPhone,
  propertySheet,
  smartMatch,
  stageLabel,
  waLink,
} from "@/lib/crm/rules";
import { useCrm } from "@/lib/crm/store";
import { img } from "@/lib/crm/images";
import type { InteractionKind, Lead, StageId } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

const KIND_META: Record<InteractionKind, { label: string; icon: typeof StickyNote }> = {
  nota: { label: "Nota", icon: StickyNote },
  ligacao: { label: "Ligação", icon: Phone },
  whatsapp: { label: "WhatsApp", icon: MessageSquareText },
  visita: { label: "Visita", icon: CalendarClock },
  etapa: { label: "Etapa", icon: ArrowRightLeft },
};

export function propertyUrl(id: string) {
  return typeof window === "undefined" ? `/imovel/${id}` : `${window.location.origin}/imovel/${id}`;
}

export function LeadDrawer({ leadId, onClose }: { leadId: string | null; onClose: () => void }) {
  const { leads } = useCrm();
  const lead = leads.find((l) => l.id === leadId);
  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
        {lead && <LeadDetails lead={lead} />}
      </SheetContent>
    </Sheet>
  );
}

function LeadDetails({ lead }: { lead: Lead }) {
  const { brokerById, properties, moveLead, addInteraction, viewer } = useCrm();
  const owner = brokerById(lead.ownerId);
  const interest = properties.find((p) => p.id === lead.interestPropertyId);
  const matches = smartMatch(lead, properties);
  const stage = STAGES.find((s) => s.id === lead.stage)!;
  const initials = lead.name.split(" ").map((p) => p[0]).slice(0, 2).join("");

  return (
    <div className="flex min-h-full flex-col">
      {/* Header */}
      <div className="border-b bg-secondary/50 px-5 pt-6 pb-5">
        <div className="flex items-start gap-3.5 pr-6">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary font-display text-xl font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-display text-xl">{lead.name}</SheetTitle>
            <SheetDescription className="mt-0.5 text-xs">
              Lead via {lead.source} · criado há {timeAgo(lead.createdAt)}
              {viewer.kind === "admin" && owner && <> · Corretor: {owner.name}</>}
            </SheetDescription>
            <div className="mt-3">
              <Select value={lead.stage} onValueChange={(v) => moveLead(lead.id, v as StageId)}>
                <SelectTrigger className="h-8 w-auto gap-2 rounded-full bg-card text-xs font-semibold">
                  <span className={cn("size-2 rounded-full", stage.color)} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Button asChild variant="whatsapp" className="h-11 rounded-xl">
            <a
              href={waLink(lead.phone, contextualMessage(lead, owner, interest))}
              target="_blank"
              rel="noreferrer"
              onClick={() => addInteraction(lead.id, { kind: "whatsapp", text: "Mensagem contextual enviada." })}
            >
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl bg-card">
            <a href={`tel:+${lead.phone}`} onClick={() => addInteraction(lead.id, { kind: "ligacao", text: "Ligação iniciada pelo CRM." })}>
              <Phone /> Ligar
            </a>
          </Button>
          <Button asChild variant="outline" className="h-11 rounded-xl bg-card">
            <a href={`mailto:${lead.email}`}>
              <Mail /> E-mail
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="match" className="flex-1 px-5 pt-4 pb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="match" className="gap-1.5">
            <Sparkles className="size-3.5" /> Smart Match
            <span className="rounded-full bg-highlight px-1.5 text-[10px] font-bold text-highlight-foreground">{matches.length}</span>
          </TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="profile">Contato</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-5 space-y-5">
          <Section title="Dados de contato">
            <InfoRow icon={Phone} label="Telefone" value={formatPhone(lead.phone)} />
            <InfoRow icon={Mail} label="E-mail" value={lead.email} />
          </Section>
          <Section title="Perfil de busca">
            <InfoRow icon={Home} label="Tipo" value={lead.propertyType} />
            <InfoRow icon={Wallet} label="Orçamento" value={`${brl(lead.budgetMin)} a ${brl(lead.budgetMax)}`} />
            <InfoRow icon={BedDouble} label="Quartos" value={`${lead.bedrooms} ou mais`} />
            <InfoRow icon={MapPin} label="Bairros" value={lead.neighborhoods.join(", ")} />
          </Section>
          {interest && (
            <Section title="Imóvel de interesse">
              <PropertyMini propertyId={interest.id} />
            </Section>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-5">
          <HistoryTab lead={lead} />
        </TabsContent>

        <TabsContent value="match" className="mt-5 space-y-3">
          <p className="text-xs text-muted-foreground">
            Cruzamento automático por <strong className="text-foreground">orçamento</strong>,{" "}
            <strong className="text-foreground">tipo</strong> e <strong className="text-foreground">bairro</strong>.
          </p>
          {matches.length === 0 && (
            <div className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhum imóvel compatível no momento.
            </div>
          )}
          {matches.map((m) => (
            <MatchCard key={m.property.id} lead={lead} match={m} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">{title}</h3>
      <div className="divide-y rounded-2xl border bg-card">{children}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Phone; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{value}</span>
    </div>
  );
}

function PropertyMini({ propertyId }: { propertyId: string }) {
  const { properties } = useCrm();
  const p = properties.find((x) => x.id === propertyId);
  if (!p) return null;
  return (
    <Link to="/imoveis/$id" params={{ id: p.id }} className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/60">
      <img src={img(p.photos[0])} alt={p.title} loading="lazy" width={1280} height={864} className="size-16 rounded-xl object-cover" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{p.title}</p>
        <p className="text-xs text-muted-foreground">
          {p.neighborhood} · {p.area} m² · {p.bedrooms} qts
        </p>
        <p className="mt-0.5 text-sm font-bold text-primary">{brl(p.price)}</p>
      </div>
    </Link>
  );
}

function MatchCard({ lead, match }: { lead: Lead; match: ReturnType<typeof smartMatch>[number] }) {
  const { addInteraction } = useCrm();
  const [copied, setCopied] = useState(false);
  const p = match.property;
  const url = propertyUrl(p.id);
  const chips = [
    { ok: match.reasons.budget, label: "Orçamento" },
    { ok: match.reasons.type, label: "Tipo" },
    { ok: match.reasons.neighborhood, label: "Bairro" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-card">
      <div className="flex gap-3 p-3">
        <Link to="/imoveis/$id" params={{ id: p.id }} className="shrink-0">
          <img src={img(p.photos[0])} alt={p.title} loading="lazy" width={1280} height={864} className="size-20 rounded-xl object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold">{p.title}</p>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
                match.score === 100 ? "bg-highlight text-highlight-foreground" : "bg-secondary text-secondary-foreground",
              )}
            >
              {match.score}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {p.neighborhood} · {p.type} · {p.bedrooms} qts · {p.area} m²
          </p>
          <p className="mt-0.5 text-sm font-bold text-primary">{brl(p.price)}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {chips.map((c) => (
              <span
                key={c.label}
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                  c.ok ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground line-through",
                )}
              >
                {c.label}
              </span>
            ))}
            {p.status === "reservado" && (
              <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-foreground">Reservado</span>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 border-t">
        <button
          className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors hover:bg-muted"
          onClick={async () => {
            await shareLink({ title: p.title, text: `${p.title} • ${p.neighborhood} • ${brl(p.price)}`, url });
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />} Compartilhar
        </button>
        <a
          href={waLink(lead.phone, `Oi, ${lead.name.split(" ")[0]}! Separei este imóvel para você:\n\n${propertySheet(p, url)}`)}
          target="_blank"
          rel="noreferrer"
          onClick={() => addInteraction(lead.id, { kind: "whatsapp", text: `Ficha enviada: ${p.code} — ${p.title}` })}
          className="flex items-center justify-center gap-1.5 border-l py-2.5 text-xs font-semibold text-whatsapp transition-colors hover:bg-muted"
        >
          <WhatsAppIcon className="size-3.5" /> Enviar ficha
        </a>
      </div>
    </div>
  );
}

function HistoryTab({ lead }: { lead: Lead }) {
  const { addInteraction, properties, brokerById } = useCrm();
  const [mode, setMode] = useState<"nota" | "visita">("nota");
  const [kind, setKind] = useState<InteractionKind>("nota");
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [propId, setPropId] = useState(lead.interestPropertyId ?? "");
  const upcoming = lead.interactions.filter((i) => i.scheduledFor && new Date(i.scheduledFor) > new Date());

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "nota") {
      if (!text.trim()) return;
      addInteraction(lead.id, { kind, text: text.trim() });
      toast.success("Interação registrada");
    } else {
      if (!when) {
        toast.error("Escolha data e horário");
        return;
      }
      const p = properties.find((x) => x.id === propId);
      addInteraction(lead.id, {
        kind: "visita",
        text: `Visita agendada${p ? ` — ${p.code} ${p.title}` : ""}${text.trim() ? `. ${text.trim()}` : ""}`,
        scheduledFor: new Date(when).toISOString(),
      });
      toast.success("Visita agendada");
    }
    setText("");
    setWhen("");
  }

  return (
    <div className="space-y-5">
      {upcoming.length > 0 && (
        <div className="space-y-2">
          {upcoming.map((u) => (
            <div key={u.id} className="flex items-center gap-3 rounded-2xl bg-stage-visit/10 p-3">
              <CalendarClock className="size-5 text-stage-visit" />
              <div className="text-sm">
                <p className="font-semibold">
                  {format(new Date(u.scheduledFor!), "EEEE, dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                </p>
                <p className="text-xs text-muted-foreground">{u.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="space-y-3 rounded-2xl border bg-card p-3.5">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {(["nota", "visita"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-xs font-semibold transition",
                mode === m ? "bg-card shadow-sm" : "text-muted-foreground",
              )}
            >
              {m === "nota" ? "Registrar interação" : "Agendar visita"}
            </button>
          ))}
        </div>
        {mode === "nota" ? (
          <Select value={kind} onValueChange={(v) => setKind(v as InteractionKind)}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nota">Nota</SelectItem>
              <SelectItem value="ligacao">Ligação</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Data e horário" />
            <Select value={propId} onValueChange={setPropId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Imóvel" />
              </SelectTrigger>
              <SelectContent>
                {properties
                  .filter((p) => p.status !== "vendido")
                  .map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code} · {p.title}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={mode === "nota" ? "O que foi conversado?" : "Observações (opcional)"}
          rows={2}
        />
        <Button type="submit" className="w-full">
          {mode === "nota" ? "Salvar no histórico" : "Agendar visita"}
        </Button>
      </form>

      <ol className="relative space-y-4 pl-6 before:absolute before:top-1 before:bottom-1 before:left-[9px] before:w-px before:bg-border">
        {lead.interactions.map((i) => {
          const meta = KIND_META[i.kind];
          const author = i.authorId === "admin" ? "Admin" : brokerById(i.authorId)?.name.split(" ")[0];
          return (
            <li key={i.id} className="relative">
              <span className="absolute top-0.5 -left-6 grid size-[19px] place-items-center rounded-full border bg-card">
                <meta.icon className="size-2.5 text-primary" />
              </span>
              <p className="text-sm">
                {i.kind === "etapa" ? (
                  <>
                    Movido para <strong>{stageLabel(i.text as StageId)}</strong>
                  </>
                ) : (
                  i.text
                )}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {meta.label} · há {timeAgo(i.at)} · {author}
                {i.scheduledFor && <> · para {format(new Date(i.scheduledFor), "dd/MM HH:mm")}</>}
              </p>
            </li>
          );
        })}
        {lead.interactions.length === 0 && <li className="text-sm text-muted-foreground">Sem interações ainda.</li>}
      </ol>
    </div>
  );
}

