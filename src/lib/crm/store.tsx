import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { visibleLeads } from "./rules";
import type { Broker, Interaction, InteractionKind, Lead, Property, PropertyStatus, PropertyType, StageId, Viewer } from "./types";

type Me = { id: string; isAdmin: boolean };

type Ctx = {
  ready: boolean;
  me: Me | null;
  /** Real role from the database. */
  isAdmin: boolean;
  viewer: Viewer;
  /** Sales team (corretores). */
  brokers: Broker[];
  /** Everyone in the agency, admins included. */
  team: (Broker & { email: string; role: "admin" | "corretor" })[];
  leads: Lead[]; // filtered by viewer (database already filters for corretores)
  allLeads: Lead[];
  properties: Property[];
  currentBroker?: Broker | undefined;
  brokerById: (id: string) => Broker | undefined;
  setViewer: (v: Viewer) => void;
  moveLead: (id: string, stage: StageId) => void;
  addInteraction: (leadId: string, i: Omit<Interaction, "id" | "at" | "authorId"> & { at?: string }) => void;
  addLead: (l: Omit<Lead, "id" | "createdAt" | "lastContactAt" | "interactions">) => Lead;
  addProperty: (p: Omit<Property, "id" | "code" | "createdAt">) => Property;
  reload: () => Promise<void>;
};

const CrmContext = createContext<Ctx | null>(null);
const CONTACT_KINDS: Interaction["kind"][] = ["ligacao", "whatsapp", "visita", "nota"];

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

function fail(e: unknown) {
  console.error(e);
  toast.error("Não foi possível salvar", { description: "Verifique sua conexão e tente novamente." });
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [team, setTeam] = useState<Ctx["team"]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [ready, setReady] = useState(false);
  const [viewer, setViewer] = useState<Viewer>({ kind: "admin" });

  const reload = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [profiles, roles, props, leadRows, inter] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("interactions").select("*").order("at", { ascending: false }),
    ]);
    const err = profiles.error || roles.error || props.error || leadRows.error || inter.error;
    if (err) {
      fail(err);
      return;
    }
    const adminIds = new Set(roles.data!.filter((r) => r.role === "admin").map((r) => r.user_id));
    const isAdmin = adminIds.has(u.user.id);
    setMe({ id: u.user.id, isAdmin });
    setTeam(
      profiles.data!.map((p) => ({
        id: p.id,
        name: p.name || p.email,
        phone: p.phone,
        creci: p.creci,
        email: p.email,
        initials: initials(p.name || p.email),
        role: adminIds.has(p.id) ? "admin" : "corretor",
      })),
    );
    const paths = props.data!.flatMap((p) => storagePaths(p.photos ?? []));
    if (paths.length) {
      const { data: signed } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 60 * 60 * 24 * 7);
      for (const s of signed ?? []) if (s.signedUrl && s.path) registerPhotoUrl(STORAGE_PREFIX + s.path, s.signedUrl);
    }
    setProperties(
      props.data!.map((p) => ({
        id: p.id,
        code: p.code,
        title: p.title,
        type: p.type as PropertyType,
        price: Number(p.price),
        neighborhood: p.neighborhood,
        city: p.city,
        address: p.address,
        bedrooms: p.bedrooms,
        suites: p.suites,
        bathrooms: p.bathrooms,
        parking: p.parking,
        area: Number(p.area),
        condo: Number(p.condo),
        iptu: Number(p.iptu),
        description: p.description,
        features: p.features,
        photos: p.photos,
        brokerId: p.broker_id ?? "",
        status: p.status as PropertyStatus,
        createdAt: p.created_at,
      })),
    );
    const byLead = new Map<string, Interaction[]>();
    for (const i of inter.data!) {
      const list = byLead.get(i.lead_id) ?? [];
      list.push({
        id: i.id,
        kind: i.kind as InteractionKind,
        text: i.text,
        at: i.at,
        scheduledFor: i.scheduled_for ?? undefined,
        authorId: i.author_id,
      });
      byLead.set(i.lead_id, list);
    }
    setLeads(
      leadRows.data!.map((l) => ({
        id: l.id,
        name: l.name,
        phone: l.phone,
        email: l.email,
        ownerId: l.owner_id,
        stage: l.stage as StageId,
        propertyType: l.property_type as PropertyType,
        budgetMin: Number(l.budget_min),
        budgetMax: Number(l.budget_max),
        bedrooms: l.bedrooms,
        neighborhoods: l.neighborhoods,
        interestPropertyId: l.interest_property_id ?? undefined,
        source: l.source,
        createdAt: l.created_at,
        lastContactAt: l.last_contact_at,
        interactions: byLead.get(l.id) ?? [],
      })),
    );
    setViewer((v) => (isAdmin ? v : { kind: "broker", brokerId: u.user!.id }));
    setReady(true);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<Ctx>(() => {
    const authorId = me?.id ?? "";
    const brokers = team.filter((t) => t.role === "corretor");
    const pushInteraction = (leadId: string, kind: InteractionKind, text: string, at: string, scheduledFor?: string) => {
      const id = crypto.randomUUID();
      setLeads((ls) =>
        ls.map((l) =>
          l.id !== leadId
            ? l
            : {
                ...l,
                lastContactAt: CONTACT_KINDS.includes(kind) ? at : l.lastContactAt,
                interactions: [{ id, kind, text, at, scheduledFor, authorId }, ...l.interactions],
              },
        ),
      );
      void supabase
        .from("interactions")
        .insert({ id, lead_id: leadId, kind, text, at, scheduled_for: scheduledFor ?? null, author_id: authorId })
        .then(({ error }) => error && fail(error));
      if (CONTACT_KINDS.includes(kind)) {
        void supabase.from("leads").update({ last_contact_at: at }).eq("id", leadId).then(({ error }) => error && fail(error));
      }
    };

    return {
      ready,
      me,
      isAdmin: !!me?.isAdmin,
      viewer,
      brokers,
      team,
      allLeads: leads,
      leads: visibleLeads(leads, viewer),
      properties,
      currentBroker: viewer.kind === "broker" ? team.find((b) => b.id === viewer.brokerId) : undefined,
      brokerById: (id) => team.find((b) => b.id === id),
      setViewer: (v) => {
        if (me?.isAdmin) setViewer(v); // corretores can never widen their view
      },
      moveLead: (id, stage) => {
        const lead = leads.find((l) => l.id === id);
        if (!lead || lead.stage === stage) return;
        setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)));
        void supabase.from("leads").update({ stage }).eq("id", id).then(({ error }) => error && fail(error));
        pushInteraction(id, "etapa", stage, new Date().toISOString());
      },
      addInteraction: (leadId, i) => pushInteraction(leadId, i.kind, i.text, i.at ?? new Date().toISOString(), i.scheduledFor),
      addLead: (l) => {
        const now = new Date().toISOString();
        const lead: Lead = { ...l, id: crypto.randomUUID(), createdAt: now, lastContactAt: now, interactions: [] };
        setLeads((ls) => [lead, ...ls]);
        void supabase
          .from("leads")
          .insert({
            id: lead.id,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            owner_id: lead.ownerId,
            stage: lead.stage,
            property_type: lead.propertyType,
            budget_min: lead.budgetMin,
            budget_max: lead.budgetMax,
            bedrooms: lead.bedrooms,
            neighborhoods: lead.neighborhoods,
            interest_property_id: lead.interestPropertyId ?? null,
            source: lead.source,
          })
          .then(({ error }) => error && fail(error));
        return lead;
      },
      addProperty: (p) => {
        const prop: Property = { ...p, id: crypto.randomUUID(), code: "MOR-…", createdAt: new Date().toISOString() };
        setProperties((ps) => [prop, ...ps]);
        void supabase
          .from("properties")
          .insert({
            id: prop.id,
            title: p.title,
            type: p.type,
            price: p.price,
            neighborhood: p.neighborhood,
            city: p.city,
            address: p.address,
            bedrooms: p.bedrooms,
            suites: p.suites,
            bathrooms: p.bathrooms,
            parking: p.parking,
            area: p.area,
            condo: p.condo,
            iptu: p.iptu,
            description: p.description,
            features: p.features,
            photos: p.photos,
            broker_id: p.brokerId || null,
            status: p.status,
          })
          .select("code")
          .single()
          .then(({ data, error }) => {
            if (error) return fail(error);
            setProperties((ps) => ps.map((x) => (x.id === prop.id ? { ...x, code: data.code } : x)));
          });
        return prop;
      },
      reload,
    };
  }, [ready, me, team, leads, properties, viewer, reload]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}
