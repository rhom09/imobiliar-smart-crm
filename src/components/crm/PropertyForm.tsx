import { useRef, useState } from "react";
import { Check, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEIGHBORHOODS, PROPERTY_TYPES } from "@/lib/crm/rules";
import {
  PHOTO_BUCKET,
  SAMPLE_PHOTO_KEYS,
  STORAGE_PREFIX,
  img,
  registerPhotoUrl,
} from "@/lib/crm/images";
import { supabase } from "@/integrations/supabase/client";
import { useCrm } from "@/lib/crm/store";
import type { Property, PropertyStatus, PropertyType } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export type PropertyInput = Omit<Property, "id" | "code" | "createdAt">;

/** Downscale uploads before sending them to storage. */
function resizeImage(file: File, max = 1600): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onerror = reject;
    image.onload = () => {
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("blob"))), "image/jpeg", 0.82);
    };
    image.src = url;
  });
}

async function uploadPhoto(file: File): Promise<string> {
  const blob = await resizeImage(file);
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg" });
  if (error) throw error;
  const key = STORAGE_PREFIX + path;
  registerPhotoUrl(key, URL.createObjectURL(blob));
  return key;
}

export function PropertyForm({
  initial,
  submitLabel,
  onSave,
}: {
  initial?: Property;
  submitLabel: string;
  onSave: (p: PropertyInput) => void;
}) {
  const { team: brokers, viewer, me } = useCrm();
  const str = (n: number | undefined, d = "") => (n === undefined ? d : String(n));
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [uploading, setUploading] = useState(0);
  const [f, setF] = useState({
    title: initial?.title ?? "",
    type: (initial?.type ?? "Apartamento") as PropertyType,
    price: str(initial?.price),
    neighborhood: initial?.neighborhood ?? NEIGHBORHOODS[0]!,
    address: initial?.address ?? "",
    bedrooms: str(initial?.bedrooms, "2"),
    suites: str(initial?.suites, "1"),
    bathrooms: str(initial?.bathrooms, "2"),
    parking: str(initial?.parking, "1"),
    area: str(initial?.area),
    condo: str(initial?.condo),
    iptu: str(initial?.iptu),
    description: initial?.description ?? "",
    features: initial?.features.join(", ") ?? "",
    status: (initial?.status ?? "disponivel") as PropertyStatus,
    brokerId: initial?.brokerId ?? (viewer.kind === "broker" ? viewer.brokerId : (me?.id ?? "")),
  });
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF((x) => ({ ...x, [k]: e.target.value }));
  const num = (s: string) => Number(s.replace(/\D/g, "")) || 0;

  async function onFiles(files: FileList | null) {
    if (!files) return;
    const list = Array.from(files).slice(0, 12);
    setUploading((n) => n + list.length);
    await Promise.all(
      list.map(async (file) => {
        try {
          const key = await uploadPhoto(file);
          setPhotos((p) => [...p, key]);
        } catch {
          toast.error(`Não foi possível enviar ${file.name}`);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !num(f.price) || !num(f.area)) {
      toast.error("Preencha título, preço e área");
      return;
    }
    if (uploading) {
      toast.error("Aguarde o envio das fotos terminar");
      return;
    }
    if (photos.length === 0) {
      toast.error("Adicione ao menos uma foto");
      return;
    }
    onSave({
      title: f.title.trim(),
      type: f.type,
      price: num(f.price),
      neighborhood: f.neighborhood,
      city: initial?.city ?? "São Paulo",
      address: f.address.trim() || "Endereço sob consulta",
      bedrooms: num(f.bedrooms),
      suites: num(f.suites),
      bathrooms: num(f.bathrooms),
      parking: num(f.parking),
      area: num(f.area),
      condo: num(f.condo),
      iptu: num(f.iptu),
      description: f.description.trim(),
      features: f.features
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      photos,
      brokerId: viewer.kind === "broker" && !initial ? viewer.brokerId : f.brokerId,
      status: f.status,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 px-4 md:px-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <Card title="Informações principais">
          <Field label="Título do anúncio" id="t">
            <Input
              id="t"
              value={f.title}
              onChange={set("title")}
              placeholder="Ex.: Apartamento com varanda gourmet"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tipo">
              <Select
                value={f.type}
                onValueChange={(v) => setF((x) => ({ ...x, type: v as PropertyType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Preço (R$)" id="pr">
              <Input
                id="pr"
                inputMode="numeric"
                value={f.price}
                onChange={set("price")}
                placeholder="950000"
              />
            </Field>
            <Field label="Situação">
              <Select
                value={f.status}
                onValueChange={(v) => setF((x) => ({ ...x, status: v as PropertyStatus }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="reservado">Reservado</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <Field label="Bairro">
              <Select
                value={f.neighborhood}
                onValueChange={(v) => setF((x) => ({ ...x, neighborhood: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Endereço" id="ad">
              <Input
                id="ad"
                value={f.address}
                onChange={set("address")}
                placeholder="Rua, número"
              />
            </Field>
          </div>
        </Card>

        <Card title="Especificações">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <Field label="Área (m²)" id="ar">
              <Input id="ar" inputMode="numeric" value={f.area} onChange={set("area")} />
            </Field>
            <Field label="Quartos" id="qt">
              <Input id="qt" inputMode="numeric" value={f.bedrooms} onChange={set("bedrooms")} />
            </Field>
            <Field label="Suítes" id="su">
              <Input id="su" inputMode="numeric" value={f.suites} onChange={set("suites")} />
            </Field>
            <Field label="Banheiros" id="bh">
              <Input id="bh" inputMode="numeric" value={f.bathrooms} onChange={set("bathrooms")} />
            </Field>
            <Field label="Vagas" id="vg">
              <Input id="vg" inputMode="numeric" value={f.parking} onChange={set("parking")} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Condomínio (R$)" id="cd">
              <Input id="cd" inputMode="numeric" value={f.condo} onChange={set("condo")} />
            </Field>
            <Field label="IPTU mensal (R$)" id="ip">
              <Input id="ip" inputMode="numeric" value={f.iptu} onChange={set("iptu")} />
            </Field>
          </div>
          <Field label="Diferenciais (separados por vírgula)" id="ft">
            <Input
              id="ft"
              value={f.features}
              onChange={set("features")}
              placeholder="Piscina, Varanda gourmet, Pet friendly"
            />
          </Field>
          <Field label="Descrição" id="ds">
            <Textarea id="ds" rows={4} value={f.description} onChange={set("description")} />
          </Field>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Galeria de fotos">
          <div className="grid grid-cols-3 gap-2">
            {photos.map((ph, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
                <img src={img(ph)} alt="" className="size-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-card/90 px-1.5 text-[10px] font-bold">
                    Capa
                  </span>
                )}
                <button
                  type="button"
                  aria-label="Remover foto"
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-card/90"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="grid aspect-square place-items-center rounded-xl border-2 border-dashed text-muted-foreground transition hover:border-primary hover:text-primary"
            >
              <span className="flex flex-col items-center gap-1 text-[11px] font-semibold">
                <ImagePlus className="size-5" />
                {uploading ? `Enviando ${uploading}…` : "Enviar"}
              </span>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <div>
            <p className="mb-2 text-xs text-muted-foreground">Ou use fotos de exemplo:</p>
            <div className="grid grid-cols-4 gap-1.5">
              {SAMPLE_PHOTO_KEYS.map((k) => {
                const on = photos.includes(k);
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setPhotos((p) => (on ? p.filter((x) => x !== k) : [...p, k]))}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg ring-offset-1 transition",
                      on && "ring-2 ring-primary",
                    )}
                  >
                    <img src={img(k)} alt="" loading="lazy" className="size-full object-cover" />
                    {on && (
                      <span className="absolute inset-0 grid place-items-center bg-primary/40">
                        <Check className="size-4 text-primary-foreground" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        {viewer.kind === "admin" && (
          <Card title="Corretor responsável">
            <Select value={f.brokerId} onValueChange={(v) => setF((x) => ({ ...x, brokerId: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {brokers.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Card>
        )}

        <Button type="submit" size="lg" className="w-full rounded-xl">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border bg-card p-5 shadow-card">
      <h2 className="text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, id, children }: { label: string; id?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
