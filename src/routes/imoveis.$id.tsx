import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  Car,
  Check,
  Link2,
  MapPin,
  Maximize2,
  Share2,
  Sparkles,
  BedSingle,
} from "lucide-react";
import { toast } from "sonner";
import { LoadingBlock } from "@/components/crm/AppShell";
import { STATUS_META } from "@/components/crm/PropertyCard";
import { WhatsAppIcon } from "@/components/crm/WhatsAppIcon";
import { LeadDrawer, propertyUrl } from "@/components/crm/LeadDrawer";
import { Button } from "@/components/ui/button";
import { brl, formatPhone, propertySheet, smartMatch, waLink } from "@/lib/crm/rules";
import { img } from "@/lib/crm/images";
import { useCrm } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/imoveis/$id")({
  head: () => ({
    meta: [
      { title: "Ficha do imóvel — Morada CRM" },
      { name: "description", content: "Galeria de fotos, especificações completas e compartilhamento do imóvel." },
      { property: "og:title", content: "Ficha do imóvel — Morada CRM" },
      { property: "og:description", content: "Veja fotos, metragem, quartos, vagas e valores deste imóvel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PropertyPage,
});

function PropertyPage() {
  const { id } = Route.useParams();
  const { ready, properties, brokerById, leads } = useCrm();
  const [photo, setPhoto] = useState(0);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!ready) return <LoadingBlock />;
  const p = properties.find((x) => x.id === id);
  if (!p) {
    return (
      <div className="p-10 text-center">
        <p className="font-semibold">Imóvel não encontrado</p>
        <Button asChild variant="link"><Link to="/imoveis">Voltar ao catálogo</Link></Button>
      </div>
    );
  }

  const broker = brokerById(p.brokerId);
  const url = propertyUrl(p.id);
  const sheet = propertySheet(p, url);
  const interested = leads
    .filter((l) => l.stage !== "ganho" && l.stage !== "perdido")
    .flatMap((l) => {
      const match = smartMatch(l, [p])[0];
      return match ? [{ lead: l, match }] : [];
    })
    .sort((a, b) => b.match.score - a.match.score);

  async function share() {
    const data = { title: p!.title, text: sheet, url };
    if (navigator.share) {
      try {
        await navigator.share(data);
        return;
      } catch {
        /* cancelled */
      }
    }
    await copy();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link do imóvel copiado");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  }

  const specs = [
    { icon: Maximize2, label: "Área útil", value: `${p.area} m²` },
    { icon: BedDouble, label: "Quartos", value: String(p.bedrooms) },
    { icon: BedSingle, label: "Suítes", value: String(p.suites) },
    { icon: Bath, label: "Banheiros", value: String(p.bathrooms) },
    { icon: Car, label: "Vagas", value: String(p.parking) },
  ];

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between px-4 pt-4 md:px-8 md:pt-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/imoveis"><ArrowLeft /> Catálogo</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="rounded-full bg-card" onClick={copy}>
            {copied ? <Check /> : <Link2 />} <span className="hidden sm:inline">Copiar link</span>
          </Button>
          <Button size="sm" className="rounded-full" onClick={share}>
            <Share2 /> Compartilhar
          </Button>
        </div>
      </div>

      {/* Gallery */}
      <div className="mt-4 px-4 md:px-8">
        <div className="grid gap-2 md:grid-cols-[1fr_180px]">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted md:aspect-[16/9]">
            <img src={img(p.photos[photo])} alt={`${p.title} — foto ${photo + 1}`} width={1280} height={864} className="size-full object-cover" />
            <span className={cn("absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-bold", STATUS_META[p.status].className)}>
              {STATUS_META[p.status].label}
            </span>
            <span className="absolute right-4 bottom-4 rounded-full bg-foreground/70 px-3 py-1 text-xs font-semibold text-background">
              {photo + 1} / {p.photos.length}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-none md:flex-col md:overflow-y-auto">
            {p.photos.map((ph, i) => (
              <button
                key={i}
                onClick={() => setPhoto(i)}
                className={cn(
                  "aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-2xl ring-offset-2 ring-offset-background transition md:w-full",
                  i === photo ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100",
                )}
              >
                <img src={img(ph)} alt="" loading="lazy" width={1280} height={864} className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 px-4 md:px-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-4" /> {p.address} — {p.neighborhood}, {p.city}
            </p>
            <h1 className="mt-1.5 text-2xl font-bold md:text-4xl">{p.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{p.type} · Código {p.code}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {specs.map((s) => (
              <div key={s.label} className="rounded-2xl border bg-card p-3 text-center">
                <s.icon className="mx-auto size-5 text-primary" />
                <p className="mt-1.5 font-display text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Descrição</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{p.description}</p>
          </div>

          {p.features.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold">Diferenciais</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.features.map((f) => (
                  <span key={f} className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
                    <Check className="size-3.5" /> {f}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border bg-card p-5 shadow-card">
            <p className="text-sm text-muted-foreground">Valor de venda</p>
            <p className="font-display text-3xl font-bold text-primary">{brl(p.price)}</p>
            <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Condomínio</dt><dd className="font-medium">{p.condo ? brl(p.condo) : "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">IPTU (mês)</dt><dd className="font-medium">{brl(p.iptu)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Preço / m²</dt><dd className="font-medium">{brl(Math.round(p.price / p.area))}</dd></div>
            </dl>
            <Button asChild variant="whatsapp" size="lg" className="mt-5 w-full rounded-xl">
              <a href={`https://wa.me/?text=${encodeURIComponent(sheet)}`} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="size-4" /> Enviar ficha no WhatsApp
              </a>
            </Button>
            {broker && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted p-3">
                <span className="grid size-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{broker.initials}</span>
                <div className="text-sm">
                  <p className="font-semibold">{broker.name}</p>
                  <p className="text-xs text-muted-foreground">{broker.creci} · {formatPhone(broker.phone)}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-card p-5">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-4 text-highlight-foreground" /> Leads compatíveis
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Clientes do seu funil que combinam com este imóvel.</p>
            <div className="mt-3 space-y-2">
              {interested.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lead compatível visível para você.</p>}
              {interested.slice(0, 6).map(({ lead, match }) => (
                <div key={lead.id} className="flex items-center gap-2 rounded-2xl border p-2.5">
                  <button onClick={() => setOpenLead(lead.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{match.score}% compatível</p>
                  </button>
                  <Button asChild size="icon" variant="whatsapp" className="size-8 rounded-full" aria-label={`Enviar para ${lead.name}`}>
                    <a href={waLink(lead.phone, `Oi, ${lead.name.split(" ")[0]}! Separei este imóvel para você:\n\n${sheet}`)} target="_blank" rel="noreferrer">
                      <WhatsAppIcon className="size-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
      <LeadDrawer leadId={openLead} onClose={() => setOpenLead(null)} />
    </div>
  );
}
