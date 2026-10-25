import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Bath, BedDouble, BedSingle, Car, Check, MapPin, Maximize2, Share2 } from "lucide-react";
import { shareLink } from "@/lib/crm/share";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "@/components/crm/WhatsAppIcon";
import { getPublicProperty, submitInterest } from "@/lib/crm/public.functions";
import { brl, waLink } from "@/lib/crm/rules";
import { img } from "@/lib/crm/images";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/imovel/$id")({
  loader: async ({ params }) => {
    const p = await getPublicProperty({ data: params.id }).catch(() => null);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData: p }) => {
    const title = p ? `${p.title} — ${brl(p.price)}` : "Imóvel — Morada";
    const desc = p
      ? `${p.type} em ${p.neighborhood}, ${p.area} m², ${p.bedrooms} quartos, ${p.parking} vagas. Agende sua visita.`
      : "Ficha do imóvel.";
    const photo = p?.photos.find((s) => s.startsWith("https://"));
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(photo ? [{ property: "og:image", content: photo }, { name: "twitter:image", content: photo }] : []),
      ],
    };
  },
  component: PublicProperty,
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">
      <div><p className="text-lg font-semibold">Imóvel não encontrado</p>
      <p className="text-sm text-muted-foreground">Este anúncio pode ter sido removido.</p></div>
    </div>
  ),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center p-8 text-center">Não foi possível carregar o imóvel.</div>
  ),
});

function PublicProperty() {
  const p = Route.useLoaderData();
  const [photo, setPhoto] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const photos = p.photos.length ? p.photos : [undefined];
  const waText = `Olá${p.broker ? ", " + p.broker.name.split(" ")[0] : ""}! Gostei do imóvel Ref ${p.code} (${p.title}) e gostaria de agendar uma visita.`;
  const specs = [
    { icon: Maximize2, label: `${p.area} m²` },
    { icon: BedDouble, label: `${p.bedrooms} quartos` },
    { icon: BedSingle, label: `${p.suites} suítes` },
    { icon: Bath, label: `${p.bathrooms} banheiros` },
    { icon: Car, label: `${p.parking} vagas` },
  ];

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await submitInterest({ data: { propertyId: p.id, name, phone } });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-lg font-bold tracking-tight">Morada</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Ref {p.code}</span>
          <Button size="sm" variant="outline" className="rounded-full"
            onClick={() => shareLink({ title: p.title, text: `${p.title} • ${p.neighborhood} • ${brl(p.price)}`, url: window.location.href })}>
            <Share2 /> Compartilhar
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-3xl">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted sm:rounded-2xl">
          <img src={img(photos[photo])} alt={p.title} className="h-full w-full object-cover" />
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {photos.map((s, i) => (
              <button key={i} onClick={() => setPhoto(i)} aria-label={`Foto ${i + 1}`}
                className={cn("h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2", i === photo ? "border-primary" : "border-transparent")}>
                <img src={img(s)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
        <section className="space-y-5 px-4 pt-2">
          <div>
            <p className="text-sm text-muted-foreground">{p.type}</p>
            <h1 className="text-2xl font-bold leading-tight">{p.title}</h1>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{p.neighborhood}, {p.city}</p>
            <p className="mt-3 text-3xl font-bold text-primary">{brl(p.price)}</p>
            <p className="text-sm text-muted-foreground">Condomínio {brl(p.condo)} · IPTU {brl(p.iptu)}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {specs.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl bg-muted p-3 text-center text-xs">
                <s.icon className="h-5 w-5" />{s.label}
              </div>
            ))}
          </div>
          {p.description && <p className="whitespace-pre-line text-sm leading-relaxed">{p.description}</p>}
          {p.features.length > 0 && (
            <ul className="grid grid-cols-2 gap-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" />{f}</li>)}
            </ul>
          )}
          {p.broker && (
            <div className="rounded-2xl border p-4">
              <p className="text-xs text-muted-foreground">Corretor responsável</p>
              <p className="font-semibold">{p.broker.name}</p>
              {p.broker.creci && <p className="text-xs text-muted-foreground">CRECI {p.broker.creci}</p>}
            </div>
          )}
          <form onSubmit={send} className="space-y-3 rounded-2xl border bg-card p-4">
            <h2 className="font-semibold">Tenho interesse</h2>
            {sent ? (
              <p className="text-sm">Recebemos seu contato! O corretor vai falar com você em breve.</p>
            ) : (
              <>
                <Input required placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
                <Input required inputMode="tel" placeholder="WhatsApp com DDD" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <Button type="submit" className="w-full" disabled={sending}>{sending ? "Enviando..." : "Quero ser contatado"}</Button>
              </>
            )}
          </form>
        </section>
      </div>
      {p.broker?.phone && (
        <div className="fixed inset-x-0 bottom-0 border-t bg-background/95 p-3 backdrop-blur">
          <Button asChild className="mx-auto flex w-full max-w-3xl" size="lg">
            <a href={waLink(p.broker.phone, waText)} target="_blank" rel="noreferrer"><WhatsAppIcon className="h-5 w-5" /> Falar no WhatsApp</a>
          </Button>
        </div>
      )}
    </div>
  );
}
