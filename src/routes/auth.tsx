import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Morada CRM" },
      {
        name: "description",
        content: "Acesse o CRM imobiliário Morada com sua conta de corretor ou administrador.",
      },
      { property: "og:title", content: "Entrar — Morada CRM" },
      {
        property: "og:description",
        content: "Acesso da equipe ao funil de vendas e catálogo de imóveis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: "E-mail ou senha incorretos." });
      return;
    }
    navigate({ to: "/", replace: true });
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail");
      return;
    }
    toast.success("E-mail enviado", {
      description: "Confira sua caixa de entrada para criar uma nova senha.",
    });
    setMode("login");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Não foi possível entrar com Google", {
        description: "Sua conta precisa ser cadastrada antes pelo administrador.",
      });
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar p-10 text-sidebar-foreground md:flex md:flex-col md:justify-between">
        <div className="absolute -top-24 -right-24 size-80 rounded-full bg-sidebar-primary/15" />
        <div className="absolute -bottom-28 -left-10 size-72 rounded-full bg-sidebar-primary/10" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-sidebar-primary font-display text-xl font-bold text-sidebar-primary-foreground">
            m
          </span>
          <span className="font-display text-xl font-bold text-sidebar-accent-foreground">
            morada
          </span>
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl font-bold leading-tight text-sidebar-accent-foreground">
            Seu funil de vendas,
            <br />
            no bolso e na rua.
          </h2>
          <p className="mt-3 max-w-sm text-sidebar-foreground/75">
            Leads, visitas, propostas e o imóvel certo para cada cliente — com a equipe toda na
            mesma página.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-primary font-display text-xl font-bold text-primary-foreground">
              m
            </span>
            <span className="font-display text-xl font-bold">morada</span>
          </div>
          <h1 className="text-2xl font-bold">
            {mode === "login" ? "Entrar no CRM" : "Recuperar senha"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "login"
              ? "Acesso exclusivo da equipe. Novos corretores são cadastrados pelo administrador."
              : "Enviaremos um link para você criar uma nova senha."}
          </p>

          {mode === "login" && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="mt-6 w-full rounded-xl"
                onClick={google}
              >
                <GoogleIcon /> Entrar com Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou com e-mail{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form
            onSubmit={mode === "login" ? login : reset}
            className={mode === "reset" ? "mt-6 space-y-4" : "space-y-4"}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            {mode === "login" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-xs font-semibold text-primary"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                />
              </div>
            )}
            <Button type="submit" size="lg" className="w-full rounded-xl" disabled={busy}>
              {busy ? "Aguarde…" : mode === "login" ? "Entrar" : "Enviar link"}
            </Button>
            {mode === "reset" && (
              <button
                type="button"
                onClick={() => setMode("login")}
                className="w-full text-sm text-muted-foreground"
              >
                Voltar para o login
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h6c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-7.8z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8C3.9 20.5 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.7 14.1c-.2-.7-.4-1.4-.4-2.1s.1-1.4.4-2.1V7.1H2.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.1 4.9l3.6-2.8z"
      />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2.1 15 1 12 1 7.7 1 3.9 3.5 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z"
      />
    </svg>
  );
}
