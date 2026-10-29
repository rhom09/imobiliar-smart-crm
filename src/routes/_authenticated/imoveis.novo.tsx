import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/crm/AppShell";
import { PropertyForm } from "@/components/crm/PropertyForm";
import { Button } from "@/components/ui/button";
import { useCrm } from "@/lib/crm/store";

export const Route = createFileRoute("/_authenticated/imoveis/novo")({
  head: () => ({
    meta: [
      { title: "Cadastrar imóvel — Morada CRM" },
      {
        name: "description",
        content: "Cadastre um novo imóvel com fotos, especificações e valores.",
      },
      { property: "og:title", content: "Cadastrar imóvel — Morada CRM" },
      { property: "og:description", content: "Adicione imóveis ao catálogo da imobiliária." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewPropertyPage,
});

function NewPropertyPage() {
  const { addProperty } = useCrm();
  const navigate = useNavigate();
  return (
    <div className="pb-10">
      <div className="px-4 pt-4 md:px-8 md:pt-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/imoveis">
            <ArrowLeft /> Catálogo
          </Link>
        </Button>
      </div>
      <PageHeader
        title="Cadastrar imóvel"
        subtitle="Ele entra no catálogo e passa a ser sugerido no Smart Match dos leads."
      />
      <PropertyForm
        submitLabel="Salvar imóvel"
        onSave={(data) => {
          const p = addProperty(data);
          toast.success("Imóvel cadastrado", {
            description: "Já aparece no catálogo e no Smart Match.",
          });
          navigate({ to: "/imoveis/$id", params: { id: p.id } });
        }}
      />
    </div>
  );
}
