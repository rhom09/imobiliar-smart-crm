import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { PageHeader, LoadingBlock } from "@/components/crm/AppShell";
import { PropertyCard } from "@/components/crm/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NEIGHBORHOODS, PROPERTY_TYPES } from "@/lib/crm/rules";
import { useCrm } from "@/lib/crm/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/imoveis/")({
  head: () => ({
    meta: [
      { title: "Catálogo de imóveis — Morada CRM" },
      {
        name: "description",
        content:
          "Busque imóveis à venda por tipo, preço, quartos e bairro e compartilhe com seus clientes.",
      },
      { property: "og:title", content: "Catálogo de imóveis — Morada CRM" },
      {
        property: "og:description",
        content: "Imóveis à venda com filtros por tipo, preço, quartos e bairro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatalogPage,
});

const PRICE_RANGES = [
  { id: "all", label: "Qualquer preço", min: 0, max: Infinity },
  { id: "a", label: "Até R$ 700 mil", min: 0, max: 700_000 },
  { id: "b", label: "R$ 700 mil – 1,5 mi", min: 700_000, max: 1_500_000 },
  { id: "c", label: "R$ 1,5 – 3 mi", min: 1_500_000, max: 3_000_000 },
  { id: "d", label: "Acima de R$ 3 mi", min: 3_000_000, max: Infinity },
];

function CatalogPage() {
  const { ready, properties } = useCrm();
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [price, setPrice] = useState("all");
  const [beds, setBeds] = useState(0);
  const [hood, setHood] = useState("all");
  const [showSold, setShowSold] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const range = PRICE_RANGES.find((r) => r.id === price)!;
    return properties.filter(
      (p) =>
        (showSold || p.status !== "vendido") &&
        (type === "all" || p.type === type) &&
        (hood === "all" || p.neighborhood === hood) &&
        p.bedrooms >= beds &&
        p.price >= range.min &&
        p.price < range.max &&
        (!term ||
          [p.title, p.code, p.address, p.neighborhood].some((s) => s.toLowerCase().includes(term))),
    );
  }, [properties, q, type, price, beds, hood, showSold]);

  const active = type !== "all" || price !== "all" || beds > 0 || hood !== "all" || q;
  const clear = () => {
    setQ("");
    setType("all");
    setPrice("all");
    setBeds(0);
    setHood("all");
  };

  return (
    <div>
      <PageHeader
        title="Catálogo de imóveis"
        subtitle={ready ? `${list.length} de ${properties.length} imóveis` : "Carregando…"}
        actions={
          <Button asChild className="rounded-full">
            <Link to="/imoveis/novo">
              <Plus /> Cadastrar imóvel
            </Link>
          </Button>
        }
      />

      <div className="sticky top-[61px] z-20 border-y bg-background/90 px-4 py-3 backdrop-blur md:top-0 md:px-8">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative lg:w-72">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, código ou rua"
              className="h-10 rounded-full bg-card pl-9"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            <SlidersHorizontal className="size-4 shrink-0 text-muted-foreground" />
            <FilterSelect
              value={type}
              onChange={setType}
              placeholder="Tipo"
              options={[
                ["all", "Todos os tipos"],
                ...PROPERTY_TYPES.map((t) => [t, t] as [string, string]),
              ]}
            />
            <FilterSelect
              value={price}
              onChange={setPrice}
              placeholder="Preço"
              options={PRICE_RANGES.map((r) => [r.id, r.label] as [string, string])}
            />
            <FilterSelect
              value={hood}
              onChange={setHood}
              placeholder="Bairro"
              options={[
                ["all", "Todos os bairros"],
                ...NEIGHBORHOODS.map((n) => [n, n] as [string, string]),
              ]}
            />
            <div className="flex shrink-0 items-center gap-1 rounded-full border bg-card p-1">
              {[0, 1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setBeds(n)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-semibold transition",
                    beds === n ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                  )}
                >
                  {n === 0 ? "Qts" : `${n}+`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowSold((s) => !s)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition",
                showSold ? "border-primary bg-secondary" : "bg-card text-muted-foreground",
              )}
            >
              Incluir vendidos
            </button>
            {active && (
              <button
                onClick={clear}
                className="flex shrink-0 items-center gap-1 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" /> Limpar
              </button>
            )}
          </div>
        </div>
      </div>

      {!ready ? (
        <LoadingBlock />
      ) : list.length === 0 ? (
        <div className="m-4 rounded-3xl border border-dashed p-12 text-center md:m-8">
          <p className="font-semibold">Nenhum imóvel com esses filtros</p>
          <Button variant="link" onClick={clear}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 p-4 sm:grid-cols-2 md:p-8 xl:grid-cols-3 2xl:grid-cols-4">
          {list.map((p) => (
            <PropertyCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
  placeholder: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={placeholder}
        className={cn(
          "h-9 w-auto shrink-0 gap-2 rounded-full bg-card text-xs font-semibold",
          value !== "all" && "border-primary bg-secondary",
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
