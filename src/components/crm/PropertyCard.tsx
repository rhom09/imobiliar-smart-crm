import { Link } from "@tanstack/react-router";
import { BedDouble, Car, Maximize2, MapPin } from "lucide-react";
import { brl } from "@/lib/crm/rules";
import { img } from "@/lib/crm/images";
import type { Property } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export const STATUS_META = {
  disponivel: { label: "Disponível", className: "bg-card/95 text-foreground" },
  reservado: { label: "Reservado", className: "bg-highlight text-highlight-foreground" },
  vendido: { label: "Vendido", className: "bg-foreground text-background" },
} as const;

export function PropertyCard({ p }: { p: Property }) {
  const status = STATUS_META[p.status];
  return (
    <Link
      to="/imoveis/$id"
      params={{ id: p.id }}
      className="group flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={img(p.photos[0])}
          alt={p.title}
          loading="lazy"
          width={1280}
          height={864}
          className={cn("size-full object-cover transition duration-500 group-hover:scale-[1.04]", p.status === "vendido" && "grayscale-[60%]")}
        />
        <span className={cn("absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm", status.className)}>
          {status.label}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm">
          {p.code}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <MapPin className="size-3" /> {p.neighborhood} · {p.type}
        </p>
        <h3 className="mt-1 line-clamp-1 text-base font-semibold">{p.title}</h3>
        <p className="mt-2 font-display text-xl font-bold text-primary">{brl(p.price)}</p>
        <div className="mt-3 flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Maximize2 className="size-3.5" />{p.area} m²</span>
          <span className="flex items-center gap-1"><BedDouble className="size-3.5" />{p.bedrooms} qts</span>
          <span className="flex items-center gap-1"><Car className="size-3.5" />{p.parking} vagas</span>
        </div>
      </div>
    </Link>
  );
}
