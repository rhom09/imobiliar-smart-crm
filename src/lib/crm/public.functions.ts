import { createServerFn } from "@tanstack/react-start";

export type PublicProperty = {
  id: string;
  code: string;
  title: string;
  type: string;
  price: number;
  neighborhood: string;
  city: string;
  bedrooms: number;
  suites: number;
  bathrooms: number;
  parking: number;
  area: number;
  condo: number;
  iptu: number;
  description: string;
  features: string[];
  photos: string[];
  status: string;
  broker: { name: string; phone: string; creci: string } | null;
};

/** Public: returns only showcase fields of one property (no address, no leads). */
export const getPublicProperty = createServerFn({ method: "GET" })
  .validator((id: string) => {
    const v = String(id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(v)) throw new Error("not-found");
    return v;
  })
  .handler(async ({ data: id }): Promise<PublicProperty | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (!p) return null;
    let broker: PublicProperty["broker"] = null;
    if (p.broker_id) {
      const { data: b } = await supabaseAdmin
        .from("profiles")
        .select("name, phone, creci")
        .eq("id", p.broker_id)
        .maybeSingle();
      if (b) broker = { name: b.name, phone: b.phone, creci: b.creci };
    }
    const raw: string[] = p.photos ?? [];
    const paths = raw.filter((s) => s.startsWith("storage:")).map((s) => s.slice(8));
    const signed = new Map<string, string>();
    if (paths.length) {
      const { data: urls } = await supabaseAdmin.storage
        .from("property-photos")
        .createSignedUrls(paths, 60 * 60 * 24 * 7);
      for (const u of urls ?? [])
        if (u.path && u.signedUrl) signed.set("storage:" + u.path, u.signedUrl);
    }
    const photos = raw
      .map((s) => (s.startsWith("storage:") ? (signed.get(s) ?? "") : s))
      .filter((s) => s.startsWith("asset:") || s.startsWith("https://") || s.startsWith("data:"));
    return {
      id: p.id,
      code: p.code,
      title: p.title,
      type: p.type,
      price: Number(p.price),
      neighborhood: p.neighborhood,
      city: p.city,
      bedrooms: p.bedrooms,
      suites: p.suites,
      bathrooms: p.bathrooms,
      parking: p.parking,
      area: Number(p.area),
      condo: Number(p.condo),
      iptu: Number(p.iptu),
      description: p.description,
      features: p.features ?? [],
      photos,
      status: p.status,
      broker,
    };
  });

/** Public: visitor "Tenho interesse" form → creates a Novo Lead owned by the property's broker. */
export const submitInterest = createServerFn({ method: "POST" })
  .validator((input: { propertyId: string; name: string; phone: string; message?: string }) => {
    const propertyId = String(input.propertyId ?? "");
    const name = String(input.name ?? "")
      .trim()
      .slice(0, 120);
    let phone = String(input.phone ?? "").replace(/\D/g, "");
    if (phone.length === 10 || phone.length === 11) phone = "55" + phone;
    if (!/^[0-9a-f-]{36}$/i.test(propertyId)) throw new Error("Imóvel inválido");
    if (name.length < 2) throw new Error("Informe seu nome");
    if (phone.length < 12 || phone.length > 13) throw new Error("Telefone inválido");
    return {
      propertyId,
      name,
      phone,
      message: String(input.message ?? "")
        .trim()
        .slice(0, 500),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("properties")
      .select("*")
      .eq("id", data.propertyId)
      .maybeSingle();
    if (!p) throw new Error("Imóvel não encontrado");

    // Avoid duplicates: same phone + property in the last 24h.
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { data: dup } = await supabaseAdmin
      .from("leads")
      .select("id")
      .eq("phone", data.phone)
      .eq("interest_property_id", p.id)
      .gte("created_at", since)
      .limit(1);
    if (dup && dup.length) return { ok: true };

    let ownerId = p.broker_id as string | null;
    if (!ownerId) {
      const { data: admin } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .maybeSingle();
      ownerId = admin?.user_id ?? null;
    }
    if (!ownerId) throw new Error("Não foi possível registrar agora");

    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("leads").insert({
      name: data.name,
      phone: data.phone,
      owner_id: ownerId,
      stage: "novo",
      property_type: p.type,
      budget_min: Math.round(Number(p.price) * 0.85),
      budget_max: Math.round(Number(p.price) * 1.1),
      bedrooms: p.bedrooms,
      neighborhoods: [p.neighborhood],
      interest_property_id: p.id,
      source: "Página pública",
      last_contact_at: now,
    });
    if (error) throw new Error("Não foi possível registrar agora");
    return { ok: true };
  });
