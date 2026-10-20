import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BROKERS, buildSeed } from "./seed";
import { visibleLeads } from "./rules";
import type { Broker, Interaction, Lead, Property, StageId, Viewer } from "./types";

const STORAGE_KEY = "morada-crm-v1";

type Data = { leads: Lead[]; properties: Property[]; viewer: Viewer };

type Ctx = {
  ready: boolean;
  viewer: Viewer;
  brokers: Broker[];
  leads: Lead[]; // already filtered by permission
  allLeads: Lead[];
  properties: Property[];
  currentBroker?: Broker;
  brokerById: (id: string) => Broker | undefined;
  setViewer: (v: Viewer) => void;
  moveLead: (id: string, stage: StageId) => void;
  addInteraction: (leadId: string, i: Omit<Interaction, "id" | "at" | "authorId"> & { at?: string }) => void;
  addLead: (l: Omit<Lead, "id" | "createdAt" | "lastContactAt" | "interactions">) => Lead;
  addProperty: (p: Omit<Property, "id" | "code" | "createdAt">) => Property;
  resetDemo: () => void;
};

const CrmContext = createContext<Ctx | null>(null);

const uid = () => Math.random().toString(36).slice(2, 10);
const CONTACT_KINDS: Interaction["kind"][] = ["ligacao", "whatsapp", "visita", "nota"];

export function CrmProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data | null>(null);

  // Load on the client only: dates are relative to "now" and storage is browser-only.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setData(JSON.parse(raw));
        return;
      }
    } catch {
      /* ignore corrupted storage */
    }
    setData({ ...buildSeed(), viewer: { kind: "admin" } });
  }, []);

  useEffect(() => {
    if (!data) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* quota exceeded (large photos) — keep in memory */
    }
  }, [data]);

  const update = useCallback((fn: (d: Data) => Data) => setData((d) => (d ? fn(d) : d)), []);
  const viewer: Viewer = data?.viewer ?? { kind: "admin" };
  const authorId = viewer.kind === "admin" ? "admin" : viewer.brokerId;

  const value = useMemo<Ctx>(() => {
    const allLeads = data?.leads ?? [];
    return {
      ready: !!data,
      viewer,
      brokers: BROKERS,
      allLeads,
      leads: visibleLeads(allLeads, viewer),
      properties: data?.properties ?? [],
      currentBroker: viewer.kind === "broker" ? BROKERS.find((b) => b.id === viewer.brokerId) : undefined,
      brokerById: (id) => BROKERS.find((b) => b.id === id),
      setViewer: (v) => update((d) => ({ ...d, viewer: v })),
      moveLead: (id, stage) =>
        update((d) => ({
          ...d,
          leads: d.leads.map((l) =>
            l.id === id && l.stage !== stage
              ? {
                  ...l,
                  stage,
                  interactions: [
                    { id: uid(), kind: "etapa", text: stage, at: new Date().toISOString(), authorId },
                    ...l.interactions,
                  ],
                }
              : l,
          ),
        })),
      addInteraction: (leadId, i) =>
        update((d) => ({
          ...d,
          leads: d.leads.map((l) => {
            if (l.id !== leadId) return l;
            const at = i.at ?? new Date().toISOString();
            return {
              ...l,
              lastContactAt: CONTACT_KINDS.includes(i.kind) ? at : l.lastContactAt,
              interactions: [{ ...i, id: uid(), at, authorId }, ...l.interactions],
            };
          }),
        })),
      addLead: (l) => {
        const now = new Date().toISOString();
        const lead: Lead = { ...l, id: uid(), createdAt: now, lastContactAt: now, interactions: [] };
        update((d) => ({ ...d, leads: [lead, ...d.leads] }));
        return lead;
      },
      addProperty: (p) => {
        const count = (data?.properties.length ?? 0) + 1;
        const prop: Property = {
          ...p,
          id: uid(),
          code: `MOR-${1100 + count}`,
          createdAt: new Date().toISOString(),
        };
        update((d) => ({ ...d, properties: [prop, ...d.properties] }));
        return prop;
      },
      resetDemo: () => setData({ ...buildSeed(), viewer }),
    };
  }, [data, viewer, authorId, update]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}
