import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CrmProvider } from "@/lib/crm/store";
import { AppShell } from "@/components/crm/AppShell";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  return (
    <CrmProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </CrmProvider>
  );
}
