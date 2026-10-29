import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ArrowLeft, Crown, Lock, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, LoadingBlock } from "@/components/crm/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPhone } from "@/lib/crm/rules";
import { useCrm } from "@/lib/crm/store";
import { createTeamMember } from "@/lib/crm/team.functions";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — Morada CRM" },
      { name: "description", content: "Cadastre corretores e gerencie o acesso da equipe ao CRM." },
      { property: "og:title", content: "Equipe — Morada CRM" },
      { property: "og:description", content: "Gestão de corretores da imobiliária." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TeamPage,
});

const EMPTY = { name: "", email: "", phone: "", creci: "", password: "" };

function TeamPage() {
  const { ready, isAdmin, team, allLeads, reload } = useCrm();
  const create = useServerFn(createTeamMember);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!ready) return <LoadingBlock />;
  if (!isAdmin) {
    return (
      <div className="m-4 rounded-3xl border border-dashed p-8 text-center text-sm text-muted-foreground md:m-8">
        <Lock className="mx-auto mb-2 size-5" /> Apenas o Dono/Admin pode gerenciar a equipe.
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await create({ data: form });
      toast.success("Corretor cadastrado", {
        description: `${form.name} já pode entrar com e-mail e senha ou Google.`,
      });
      setForm(EMPTY);
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível cadastrar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pb-10">
      <PageHeader
        title="Equipe"
        subtitle="Somente você cadastra quem acessa o CRM."
        actions={
          <Link
            to="/imobiliaria"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground"
          >
            <ArrowLeft className="size-4" /> Imobiliária
          </Link>
        }
      />
      <div className="grid gap-5 px-4 md:px-8 lg:grid-cols-[1fr_380px]">
        <div className="overflow-hidden rounded-3xl border bg-card">
          <div className="border-b p-5 pb-3">
            <h3 className="font-semibold">
              {team.length} {team.length === 1 ? "pessoa" : "pessoas"} na equipe
            </h3>
          </div>
          <div className="divide-y">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    {m.name}{" "}
                    {m.role === "admin" && <Crown className="size-3.5 text-highlight-foreground" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.email}
                    {m.phone && ` · ${formatPhone(m.phone)}`}
                    {m.creci && ` · ${m.creci}`}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {m.role === "admin" ? "Admin" : "Corretor"}
                  </p>
                  <p>{allLeads.filter((l) => l.ownerId === m.id).length} leads</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-3xl border bg-card p-5">
          <h3 className="flex items-center gap-2 font-semibold">
            <UserPlus className="size-4" /> Cadastrar corretor
          </h3>
          <Field id="name" label="Nome completo">
            <Input id="name" required value={form.name} onChange={set("name")} className="h-11" />
          </Field>
          <Field id="email" label="E-mail de acesso">
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              className="h-11"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="phone" label="WhatsApp">
              <Input
                id="phone"
                inputMode="tel"
                placeholder="(11) 9…"
                value={form.phone}
                onChange={set("phone")}
                className="h-11"
              />
            </Field>
            <Field id="creci" label="CRECI">
              <Input id="creci" value={form.creci} onChange={set("creci")} className="h-11" />
            </Field>
          </div>
          <Field id="password" label="Senha inicial">
            <Input
              id="password"
              type="text"
              minLength={8}
              required
              value={form.password}
              onChange={set("password")}
              className="h-11"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Envie a senha ao corretor. Ele também pode entrar com o Google usando este mesmo e-mail.
          </p>
          <Button type="submit" size="lg" className="w-full rounded-xl" disabled={busy}>
            {busy ? "Cadastrando…" : "Cadastrar corretor"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
