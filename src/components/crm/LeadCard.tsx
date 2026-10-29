import { formatDistanceToNowStrict } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MoreHorizontal, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WhatsAppIcon } from "./WhatsAppIcon";
import { STAGES, brlCompact, contactUrgency, contextualMessage, waLink } from "@/lib/crm/rules";
import { useCrm } from "@/lib/crm/store";
import type { Lead, StageId } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export function timeAgo(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { locale: ptBR });
}

const URGENCY = {
  ok: "bg-secondary text-secondary-foreground",
  warn: "bg-accent text-accent-foreground",
  late: "bg-destructive/12 text-destructive",
};

export function LeadCard({
  lead,
  onOpen,
  dragging = false,
  showOwner = false,
}: {
  lead: Lead;
  onOpen?: () => void;
  dragging?: boolean;
  showOwner?: boolean;
}) {
  const { brokerById, properties, addInteraction, moveLead } = useCrm();
  const owner = brokerById(lead.ownerId);
  const interest = properties.find((p) => p.id === lead.interestPropertyId);
  const urgency = contactUrgency(lead.lastContactAt);

  return (
    <div
      onClick={onOpen}
      className={cn(
        "group relative cursor-grab select-none rounded-2xl border bg-card p-3.5 shadow-card transition-all active:cursor-grabbing",
        dragging
          ? "rotate-[1.5deg] shadow-lift ring-2 ring-primary/30"
          : "hover:-translate-y-0.5 hover:border-primary/25",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold leading-tight">{lead.name}</p>
          <p className="mt-1 truncate text-[13px] text-muted-foreground">
            {interest ? interest.title : `${lead.propertyType} · ${lead.bedrooms}+ quartos`}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Mover lead"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="-mr-1 -mt-1 rounded-lg p-1 text-muted-foreground opacity-70 transition hover:bg-muted hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuLabel>Mover para</DropdownMenuLabel>
            {STAGES.filter((s) => s.id !== lead.stage).map((s) => (
              <DropdownMenuItem key={s.id} onSelect={() => moveLead(lead.id, s.id as StageId)}>
                <span className={cn("size-2 rounded-full", s.color)} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">
          {brlCompact(lead.budgetMin)} – {brlCompact(lead.budgetMax)}
        </span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-3" />
          {lead.neighborhoods[0]}
          {lead.neighborhoods.length > 1 && ` +${lead.neighborhoods.length - 1}`}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              URGENCY[urgency],
            )}
          >
            <Clock className="size-3" />
            {timeAgo(lead.lastContactAt)}
          </span>
          {showOwner && owner && (
            <span
              title={owner.name}
              className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary"
            >
              {owner.initials}
            </span>
          )}
        </div>
        <Button
          asChild
          size="sm"
          variant="whatsapp"
          className="h-8 rounded-full px-3"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <a
            href={waLink(lead.phone, contextualMessage(lead, owner, interest))}
            target="_blank"
            rel="noreferrer"
            aria-label={`Enviar WhatsApp para ${lead.name}`}
            onClick={(e) => {
              e.stopPropagation();
              addInteraction(lead.id, {
                kind: "whatsapp",
                text: "Mensagem enviada pelo atalho do funil.",
              });
            }}
          >
            <WhatsAppIcon className="size-4" />
            <span className="text-xs">WhatsApp</span>
          </a>
        </Button>
      </div>
    </div>
  );
}
