import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/crm/AppShell";
import { PropertyForm } from "@/components/crm/PropertyForm";
import { Button } from "@/components/ui/button";
import { useCrm } from "@/lib/crm/store";

export const Route = createFileRoute("/_authenticated/imoveis/$id_/editar")({
  head: () => ({
    meta: [
      { title: "Editar imóvel — Morada CRM" },
      { name: "description", content: "Atualize dados, valores, situação e fotos do imóvel." },
      { property: "og:title", content: "Editar imóvel — Morada CRM" },
      { property: "og:description", content: "Atualize as informações do imóvel no catálogo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditPropertyPage,
});

function EditPropertyPage() {
  const { id } = Route.useParams();
  const { ready, properties, updateProperty } = useCrm();
  const navigate = useNavigate();
  const p = properties.find((x) => x.id === id);
  if (!ready) return <div className="p-10 text-center text-muted-foreground">Carregando…</div>;
  if (!p) {
    return (
      <div className="p-10 text-center">
        <p className="font-semibold">Imóvel não encontrado</p>
        <Button asChild variant="link"><Link to="/imoveis">Voltar ao catálogo</Link></Button>
      </div>
    );
  }
  return (
    <div className="pb-10">
      <div className="px-4 pt-4 md:px-8 md:pt-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/imoveis/$id" params={{ id }}><ArrowLeft /> Voltar à ficha</Link>
        </Button>
      </div>
      <PageHeader title="Editar imóvel" subtitle={`${p.code} • ${p.title}`} />
      <PropertyForm
        initial={p}
        submitLabel="Salvar alterações"
        onSave={(data) => {
          updateProperty(id, data);
          toast.success("Imóvel atualizado");
          navigate({ to: "/imoveis/$id", params: { id } });
        }}
      />
    </div>
  );
}
