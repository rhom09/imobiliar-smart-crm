import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CITIES, PROPERTY_TYPES, normalizePhone } from "@/lib/crm/rules";
import { suggestNeighborhoods } from "@/lib/crm/locations";
import { useCrm } from "@/lib/crm/store";
import type { PropertyType } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export function NewLeadDialog({ onCreated }: { onCreated?: (id: string) => void }) {
  const { viewer, team: brokers, addLead, me, properties } = useCrm();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    propertyType: "Apartamento" as PropertyType,
    budgetMin: "",
    budgetMax: "",
    bedrooms: "2",
    cities: [] as string[],
    neighborhoods: [] as string[],
    source: "WhatsApp",
    ownerId: me?.id ?? "",
  });
  const [customNeighborhood, setCustomNeighborhood] = useState("");

  // Sugestões dinâmicas baseadas nas cidades selecionadas
  const suggestedNeighborhoods = useMemo(() => {
    let allSuggested: string[] = [];
    form.cities.forEach((city) => {
      allSuggested = [...new Set([...allSuggested, ...suggestNeighborhoods(city as any, properties)])];
    });
    return allSuggested.sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [form.cities, properties]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const min = Number(form.budgetMin.replace(/\D/g, ""));
    const max = Number(form.budgetMax.replace(/\D/g, ""));
    if (!form.name.trim() || form.phone.replace(/\D/g, "").length < 10) {
      toast.error("Informe nome e telefone com DDD");
      return;
    }
    if (!max || min > max) {
      toast.error("Confira a faixa de orçamento");
      return;
    }
    const lead = addLead({
      name: form.name.trim(),
      phone: normalizePhone(form.phone),
      email: form.email.trim(),
      propertyType: form.propertyType,
      budgetMin: min,
      budgetMax: max,
      bedrooms: Number(form.bedrooms),
      cities: form.cities,
      neighborhoods: form.neighborhoods,
      source: form.source,
      stage: "novo",
      ownerId: viewer.kind === "broker" ? viewer.brokerId : form.ownerId,
    });
    toast.success("Lead criado", { description: `${lead.name} entrou em Novo Lead.` });
    setOpen(false);
    onCreated?.(lead.id);
    setForm((f) => ({
      ...f,
      name: "",
      phone: "",
      email: "",
      budgetMin: "",
      budgetMax: "",
      cities: [],
      neighborhoods: [],
    }));
    setCustomNeighborhood("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus /> Novo lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Novo lead</DialogTitle>
          <DialogDescription>O lead entra na etapa “Novo Lead” do funil.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="nl-name">Nome</Label>
            <Input
              id="nl-name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Nome do cliente"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="nl-phone">WhatsApp</Label>
              <Input
                id="nl-phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="(11) 99999-0000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nl-email">E-mail</Label>
              <Input
                id="nl-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Tipo de imóvel</Label>
              <Select
                value={form.propertyType}
                onValueChange={(v) => set("propertyType", v as PropertyType)}
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
            </div>
            <div className="grid gap-1.5">
              <Label>Quartos (mín.)</Label>
              <Select value={form.bedrooms} onValueChange={(v) => set("bedrooms", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4"].map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}+
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="nl-min">Orçamento mín. (R$)</Label>
              <Input
                id="nl-min"
                inputMode="numeric"
                value={form.budgetMin}
                onChange={(e) => set("budgetMin", e.target.value)}
                placeholder="800000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="nl-max">Orçamento máx. (R$)</Label>
              <Input
                id="nl-max"
                inputMode="numeric"
                value={form.budgetMax}
                onChange={(e) => set("budgetMax", e.target.value)}
                placeholder="1200000"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Cidades de interesse</Label>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((c) => {
                const on = form.cities.includes(c);
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() =>
                      set("cities", on ? form.cities.filter((x) => x !== c) : [...form.cities, c])
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card hover:border-primary/40",
                    )}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Bairros de interesse (opcional)</Label>
            <div className="flex gap-2">
              <Input
                value={customNeighborhood}
                onChange={(e) => setCustomNeighborhood(e.target.value)}
                placeholder="Digite um bairro e pressione Enter..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const trimmed = customNeighborhood.trim();
                    if (trimmed && !form.neighborhoods.includes(trimmed)) {
                      set("neighborhoods", [...form.neighborhoods, trimmed]);
                      setCustomNeighborhood("");
                    }
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const trimmed = customNeighborhood.trim();
                  if (trimmed && !form.neighborhoods.includes(trimmed)) {
                    set("neighborhoods", [...form.neighborhoods, trimmed]);
                    setCustomNeighborhood("");
                  }
                }}
              >
                Adicionar
              </Button>
            </div>
            {form.neighborhoods.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {form.neighborhoods.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-medium"
                  >
                    {n}
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          "neighborhoods",
                          form.neighborhoods.filter((x) => x !== n),
                        )
                      }
                      className="hover:text-destructive rounded-full p-0.5"
                      aria-label={`Remover ${n}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="mt-1">
              <p className="text-[11px] text-muted-foreground mb-1">Sugestões de bairros:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestedNeighborhoods.map((n) => {
                  const on = form.neighborhoods.includes(n);
                  return (
                    <button
                      type="button"
                      key={n}
                      onClick={() =>
                        set(
                          "neighborhoods",
                          on
                            ? form.neighborhoods.filter((x) => x !== n)
                            : [...form.neighborhoods, n],
                        )
                      }
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs transition",
                        on
                          ? "border-primary bg-primary/20 text-primary font-medium"
                          : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {on ? `✓ ${n}` : `+ ${n}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Origem</Label>
              <Select value={form.source} onValueChange={(v) => set("source", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "WhatsApp",
                    "Instagram",
                    "Portal ZAP",
                    "Portal VivaReal",
                    "Site",
                    "Indicação",
                    "Placa no imóvel",
                  ].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {viewer.kind === "admin" && (
              <div className="grid gap-1.5">
                <Label>Corretor responsável</Label>
                <Select value={form.ownerId} onValueChange={(v) => set("ownerId", v)}>
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
              </div>
            )}
          </div>
          <Button type="submit" size="lg" className="mt-1">
            Criar lead
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
