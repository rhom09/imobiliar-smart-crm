import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useState } from "react";
import { toast } from "sonner";
import { LeadCard } from "./LeadCard";
import { STAGES, brlCompact, stageLabel } from "@/lib/crm/rules";
import { useCrm } from "@/lib/crm/store";
import type { Lead, StageId } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export function KanbanBoard({ leads, onOpen }: { leads: Lead[]; onOpen: (id: string) => void }) {
  const { moveLead, viewer } = useCrm();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const active = leads.find((l) => l.id === activeId);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const to = e.over?.id as StageId | undefined;
    const lead = leads.find((l) => l.id === e.active.id);
    if (!to || !lead || lead.stage === to) return;
    moveLead(lead.id, to);
    toast.success(`${lead.name.split(" ")[0]} → ${stageLabel(to)}`);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-6 scrollbar-none md:snap-none md:px-8">
        {STAGES.map((s) => {
          const items = leads.filter((l) => l.stage === s.id);
          return (
            <Column key={s.id} id={s.id} label={s.label} color={s.color} items={items}>
              {items.map((l) => (
                <DraggableLead key={l.id} lead={l} onOpen={() => onOpen(l.id)} showOwner={viewer.kind === "admin"} />
              ))}
            </Column>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {active && <LeadCard lead={active} dragging showOwner={viewer.kind === "admin"} />}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  id,
  label,
  color,
  items,
  children,
}: {
  id: StageId;
  label: string;
  color: string;
  items: Lead[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const total = items.reduce((s, l) => s + l.budgetMax, 0);
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[84vw] max-w-[320px] shrink-0 snap-center flex-col rounded-3xl bg-column p-2.5 transition-colors sm:w-[300px]",
        isOver && "bg-secondary ring-2 ring-primary/30",
      )}
    >
      <header className="flex items-center justify-between px-1.5 pt-1 pb-3">
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", color)} />
          <h2 className="font-display text-sm font-semibold">{label}</h2>
          <span className="rounded-full bg-card px-2 text-xs font-semibold text-muted-foreground">{items.length}</span>
        </div>
        {total > 0 && <span className="text-[11px] font-medium text-muted-foreground">{brlCompact(total)}</span>}
      </header>
      <div className="flex min-h-32 flex-col gap-2.5">
        {children}
        {items.length === 0 && (
          <div className="grid flex-1 place-items-center rounded-2xl border-2 border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
            Arraste um lead para cá
          </div>
        )}
      </div>
    </section>
  );
}

function DraggableLead({ lead, onOpen, showOwner }: { lead: Lead; onOpen: () => void; showOwner: boolean }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: lead.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className={cn("touch-manipulation", isDragging && "opacity-35")}>
      <LeadCard lead={lead} onOpen={onOpen} showOwner={showOwner} />
    </div>
  );
}
