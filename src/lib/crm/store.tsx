import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { visibleLeads } from "./rules";
import { PHOTO_BUCKET, STORAGE_PREFIX, registerPhotoUrl, storagePaths } from "./images";
import type {
  Agency,
  Broker,
  Interaction,
  InteractionKind,
  Lead,
  Property,
  PropertyStatus,
  PropertyType,
  StageId,
  Viewer,
} from "./types";
import { AGENCY } from "./seed";

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
  agency: Agency;
  whatsappTemplates: Record<StageId, string>;
  leads: Lead[]; // filtered by viewer (database already filters for corretores)
  allLeads: Lead[];
  properties: Property[];
  currentBroker?: Broker | undefined;
  brokerById: (id: string) => Broker | undefined;
  setViewer: (v: Viewer) => void;
  moveLead: (id: string, stage: StageId) => void;
  addInteraction: (
    leadId: string,
    i: Omit<Interaction, "id" | "at" | "authorId"> & { at?: string },
  ) => void;
  addLead: (l: Omit<Lead, "id" | "createdAt" | "lastContactAt" | "interactions">) => Lead;
  addProperty: (p: Omit<Property, "id" | "code" | "createdAt">) => Property;
  updateProperty: (id: string, p: Partial<Omit<Property, "id" | "code" | "createdAt">>) => void;
  updateProfile: (id: string, data: { name?: string; phone?: string; creci?: string }) => Promise<boolean>;
  updateAgency: (data: Partial<Agency>) => Promise<boolean>;
  updateTemplate: (stage: StageId, text: string) => Promise<boolean>;
  /** Resolve false when the database refused (e.g. no permission). */
  deleteLead: (id: string) => Promise<boolean>;
  deleteProperty: (id: string) => Promise<boolean>;
  reload: () => Promise<void>;
};

// Keep one context object across dev hot reloads; a re-created context would orphan
// the already-mounted provider and make useCrm throw until a full page reload.
const globalCtx = globalThis as { __crmContext?: React.Context<Ctx | null> };
const CrmContext = (globalCtx.__crmContext ??= createContext<Ctx | null>(null));
const CONTACT_KINDS: Interaction["kind"][] = ["ligacao", "whatsapp", "visita", "nota"];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "?";

function fail(e: unknown) {
  console.error(e);
  toast.error("Não foi possível salvar", {
    description: "Verifique sua conexão e tente novamente.",
  });
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [team, setTeam] = useState<Ctx["team"]>([]);
  const [agency, setAgency] = useState<Agency>(AGENCY);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [ready, setReady] = useState(false);
  const [viewer, setViewer] = useState<Viewer>({ kind: "admin" });
  const [whatsappTemplates, setWhatsappTemplates] = useState<Record<StageId, string>>({
    novo: "Olá, recebemos seu interesse no imóvel...",
    contato: "Olá, tudo bem? Acompanhando seu interesse...",
    visita: "Confirmando nossa visita...",
    proposta: "Olá, segue a proposta...",
    ganho: "Parabéns pela aquisição!",
    perdido: "Obrigado pelo contato.",
  });

  const reload = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const [profiles, roles, props, leadRows, inter, agencyRes, templatesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("properties").select("*").order("created_at", { ascending: false }),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
      supabase.from("interactions").select("*").order("at", { ascending: false }),
      supabase.from("agency" as never).select("*").maybeSingle(),
      supabase.from("whatsapp_templates" as never).select("*"),
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
    const agencyData = agencyRes.data as {
      name: string;
      creci: string;
      city: string;
      address: string;
      phone: string;
      owner_name: string;
      logo_url: string | null;
    } | null;
    if (!agencyRes.error && agencyData) {
      const baseAgency = {
        name: agencyData.name,
        creci: agencyData.creci,
        city: agencyData.city,
        address: agencyData.address,
        phone: agencyData.phone,
        ownerName: agencyData.owner_name,
      };
      setAgency(agencyData.logo_url ? { ...baseAgency, logoUrl: agencyData.logo_url } : baseAgency);
    } else {
      try {
        const saved = localStorage.getItem("morada_agency");
        if (saved) {
          setAgency(JSON.parse(saved));
        }
      } catch {}
    }

    if (templatesRes.data) {
      const templates: Record<StageId, string> = { ...whatsappTemplates };
      for (const t of (templatesRes.data as unknown as Array<{ stage_id?: StageId; template_text?: string }>)) {
        if (t.stage_id && t.template_text) {
          templates[t.stage_id] = t.template_text;
        }
      }
      setWhatsappTemplates(templates);
    }
    const paths = props.data!.flatMap((p) => storagePaths(p.photos ?? []));
    if (paths.length) {
      const { data: signed } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      for (const s of signed ?? [])
        if (s.signedUrl && s.path) registerPhotoUrl(STORAGE_PREFIX + s.path, s.signedUrl);
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

  // Realtime notifications & updates via Supabase Realtime
  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel("crm-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = payload.new as { name?: string; source?: string };
          toast.success("Novo lead recebido!", {
            description: `${newLead.name || "Novo cliente"} cadastrado no funil.`,
          });
          void reload();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        () => {
          void reload();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "properties" },
        (payload) => {
          const newProp = payload.new as { code?: string; title?: string };
          toast.info("Novo imóvel cadastrado", {
            description: `${newProp.code || ""} - ${newProp.title || "Imóvel"}`,
          });
          void reload();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "properties" },
        () => {
          void reload();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [me, reload]);

  const value = useMemo<Ctx>(() => {
    const authorId = me?.id ?? "";
    const brokers = team.filter((t) => t.role === "corretor");
    const pushInteraction = (
      leadId: string,
      kind: InteractionKind,
      text: string,
      at: string,
      scheduledFor?: string,
    ) => {
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
        .insert({
          id,
          lead_id: leadId,
          kind,
          text,
          at,
          scheduled_for: scheduledFor ?? null,
          author_id: authorId,
        })
        .then(({ error }) => error && fail(error));
      if (CONTACT_KINDS.includes(kind)) {
        void supabase
          .from("leads")
          .update({ last_contact_at: at })
          .eq("id", leadId)
          .then(({ error }) => error && fail(error));
      }
    };

    return {
      ready,
      me,
      isAdmin: !!me?.isAdmin,
      viewer,
      brokers,
      team,
      agency,
      allLeads: leads,
      leads: visibleLeads(leads, viewer),
      properties,
      currentBroker:
        viewer.kind === "broker" ? team.find((b) => b.id === viewer.brokerId) : undefined,
      brokerById: (id) => team.find((b) => b.id === id),
      setViewer: (v) => {
        if (me?.isAdmin) setViewer(v); // corretores can never widen their view
      },
      moveLead: (id, stage) => {
        const lead = leads.find((l) => l.id === id);
        if (!lead || lead.stage === stage) return;
        setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, stage } : l)));
        void supabase
          .from("leads")
          .update({ stage })
          .eq("id", id)
          .then(({ error }) => error && fail(error));
        pushInteraction(id, "etapa", stage, new Date().toISOString());
      },
      addInteraction: (leadId, i) =>
        pushInteraction(leadId, i.kind, i.text, i.at ?? new Date().toISOString(), i.scheduledFor),
      addLead: (l) => {
        const now = new Date().toISOString();
        const lead: Lead = {
          ...l,
          id: crypto.randomUUID(),
          createdAt: now,
          lastContactAt: now,
          interactions: [],
        };
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
        const prop: Property = {
          ...p,
          id: crypto.randomUUID(),
          code: "MOR-…",
          createdAt: new Date().toISOString(),
        };
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
            setProperties((ps) =>
              ps.map((x) => (x.id === prop.id ? { ...x, code: data.code } : x)),
            );
          });
        return prop;
      },
      updateProperty: (id, p) => {
        setProperties((ps) => ps.map((x) => (x.id === id ? { ...x, ...p } : x)));
        const row: Record<string, unknown> = {};
        const map: Record<string, string> = { brokerId: "broker_id" };
        for (const [k, v] of Object.entries(p)) row[map[k] ?? k] = k === "brokerId" ? v || null : v;
        void supabase
          .from("properties")
          .update(row as never)
          .eq("id", id)
          .then(({ error }) => error && fail(error));
      },
      updateProfile: async (id, data) => {
        const updatePayload: Record<string, unknown> = {};
        if (data.name !== undefined) updatePayload["name"] = data.name;
        if (data.phone !== undefined) updatePayload["phone"] = data.phone;
        if (data.creci !== undefined) updatePayload["creci"] = data.creci;
        const { error } = await supabase
          .from("profiles")
          .update(updatePayload as never)
          .eq("id", id);
        if (error) {
          fail(error);
          return false;
        }
        setTeam((ts) =>
          ts.map((t) =>
            t.id === id
              ? {
                  ...t,
                  name: data.name ?? t.name,
                  phone: data.phone ?? t.phone,
                  creci: data.creci ?? t.creci,
                  initials: data.name ? initials(data.name) : t.initials,
                }
              : t,
          ),
        );
        toast.success("Perfil atualizado com sucesso!");
        return true;
      },
      updateAgency: async (data) => {
        const updated = { ...agency, ...data };
        setAgency(updated);
        try {
          localStorage.setItem("morada_agency", JSON.stringify(updated));
        } catch {}

        try {
          const { data: existing } = await supabase.from("agency" as never).select("id").maybeSingle();
          const row = {
            name: updated.name,
            creci: updated.creci,
            city: updated.city,
            address: updated.address,
            phone: updated.phone,
            owner_name: updated.ownerName,
            logo_url: updated.logoUrl ?? null,
          };
          const existingRecord = existing as { id: string } | null;
          if (existingRecord) {
            await supabase.from("agency" as never).update(row as never).eq("id", existingRecord.id);
          } else {
            await supabase.from("agency" as never).insert(row as never);
          }
        } catch (e) {
          console.warn("Agency table not yet migrated in Supabase; saved locally.", e);
        }

        toast.success("Dados da imobiliária atualizados com sucesso!");
        return true;
      },
      deleteLead: async (id) => {
        const { data, error } = await supabase.from("leads").delete().eq("id", id).select("id");
        if (error || !data?.length) return false;
        setLeads((ls) => ls.filter((l) => l.id !== id));
        return true;
      },
      deleteProperty: async (id) => {
        const { data, error } = await supabase
          .from("properties")
          .delete()
          .eq("id", id)
          .select("id");
        if (error || !data?.length) return false;
        setProperties((ps) => ps.filter((p) => p.id !== id));
        setLeads((ls) =>
          ls.map((l) =>
            l.interestPropertyId === id ? { ...l, interestPropertyId: undefined } : l,
          ),
        );
        return true;
      },
      updateTemplate: async (stage, text) => {
        const { error } = await supabase
          .from("whatsapp_templates" as never)
          .upsert({ stage_id: stage, template_text: text } as never, { onConflict: "stage_id" });
        if (error) {
          fail(error);
          return false;
        }
        setWhatsappTemplates((prev) => ({ ...prev, [stage]: text }));
        toast.success("Template atualizado!");
        return true;
      },
      reload,
      whatsappTemplates,
    };
  }, [ready, me, team, agency, whatsappTemplates, leads, properties, viewer, reload]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error("useCrm must be used inside CrmProvider");
  return ctx;
}
