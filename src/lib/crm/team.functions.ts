import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type NewMember = { name: string; email: string; password: string; phone: string; creci: string };

/** Admin-only: creates a confirmed corretor account (public sign-up is disabled). */
export const createTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: NewMember) => {
    const email = String(input.email ?? "").trim().toLowerCase();
    const name = String(input.name ?? "").trim();
    const password = String(input.password ?? "");
    if (!name || name.length > 120) throw new Error("Informe o nome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido");
    if (password.length < 8) throw new Error("A senha precisa ter ao menos 8 caracteres");
    return {
      name,
      email,
      password,
      phone: String(input.phone ?? "").replace(/\D/g, "").slice(0, 15),
      creci: String(input.creci ?? "").trim().slice(0, 40),
    };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error: roleError } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleError || !isAdmin) throw new Error("Apenas o Dono/Admin pode cadastrar corretores");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, phone: data.phone, creci: data.creci },
    });
    if (error) {
      throw new Error(
        /already/i.test(error.message) ? "Já existe um usuário com este e-mail" : "Não foi possível criar o usuário",
      );
    }
    return { id: created.user.id };
  });
