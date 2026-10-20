import { Link, useRouterState } from "@tanstack/react-router";
import { Building2, KanbanSquare, Home, RotateCcw, ShieldCheck, Eye } from "lucide-react";
import type { ReactNode } from "react";
import { RoleSwitcher } from "./RoleSwitcher";
import { useCrm } from "@/lib/crm/store";
import { AGENCY } from "@/lib/crm/seed";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Funil", icon: KanbanSquare },
  { to: "/imoveis", label: "Imóveis", icon: Home },
  { to: "/imobiliaria", label: "Imobiliária", icon: Building2 },
] as const;

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span
        className={cn(
          "grid size-9 place-items-center rounded-xl font-display text-lg font-bold",
          inverted ? "bg-sidebar-primary text-sidebar-primary-foreground" : "bg-primary text-primary-foreground",
        )}
      >
        m
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-bold tracking-tight">morada</span>
        <span className={cn("block text-[11px]", inverted ? "text-sidebar-foreground/60" : "text-muted-foreground")}>
          CRM imobiliário
        </span>
      </span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { viewer, currentBroker, resetDemo } = useCrm();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 pt-6 pb-8">
          <Logo inverted />
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(to)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className={cn("size-[18px]", isActive(to) && "text-sidebar-primary")} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto space-y-4 p-4">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3.5">
            <RoleSwitcher />
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-sidebar-foreground/70">
              {viewer.kind === "admin" ? (
                <>
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-sidebar-primary" />
                  Visão geral: todos os leads e corretores de {AGENCY.name}.
                </>
              ) : (
                <>
                  <Eye className="mt-0.5 size-3.5 shrink-0 text-sidebar-primary" />
                  Visão restrita: apenas clientes de {currentBroker?.name.split(" ")[0]}.
                </>
              )}
            </p>
          </div>
          <button
            onClick={resetDemo}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground"
          >
            <RotateCcw className="size-3.5" /> Restaurar dados de demonstração
          </button>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <RoleSwitcher compact />
      </header>

      <main className="pb-24 md:pb-0 md:pl-64">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors",
              isActive(to) ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span className={cn("rounded-full px-4 py-1", isActive(to) && "bg-secondary")}>
              <Icon className="size-5" />
            </span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-4 pt-5 pb-4 sm:flex-row sm:items-end sm:justify-between md:px-8 md:pt-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="grid gap-3 p-4 md:p-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
