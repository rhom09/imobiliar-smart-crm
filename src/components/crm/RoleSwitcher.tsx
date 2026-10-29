import { Crown, UserRound } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCrm } from "@/lib/crm/store";
import { AGENCY } from "@/lib/crm/seed";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function RoleSwitcher({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { viewer, setViewer, brokers, me, brokerById } = useCrm();
  const myName = (me && brokerById(me.id)?.name) || AGENCY.ownerName;
  const value = viewer.kind === "admin" ? "admin" : viewer.brokerId;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {!compact && (
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/60">
          Simular como
        </span>
      )}
      <Select
        value={value}
        onValueChange={(v) => {
          if (v === "admin") {
            setViewer({ kind: "admin" });
            toast.success("Visão do Dono/Admin", {
              description: "Você vê todos os leads da imobiliária.",
            });
          } else {
            setViewer({ kind: "broker", brokerId: v });
            const b = brokers.find((x) => x.id === v);
            toast.success(`Visão de ${b?.name}`, {
              description: "Apenas os clientes deste corretor ficam visíveis.",
            });
          }
        }}
      >
        <SelectTrigger
          aria-label="Simular como"
          className={cn(
            compact
              ? "h-9 w-auto max-w-[11rem] gap-1.5 rounded-full border-border bg-card px-3 text-xs font-semibold"
              : "h-11 border-sidebar-border bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Dono / Admin</SelectLabel>
            <SelectItem value="admin">
              <span className="flex items-center gap-2">
                <Crown className="size-3.5 text-highlight-foreground" />
                {compact ? "Admin" : myName}
              </span>
            </SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Corretores</SelectLabel>
            {brokers.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                <span className="flex items-center gap-2">
                  <UserRound className="size-3.5 text-muted-foreground" />
                  {compact ? b.name.split(" ")[0] : b.name}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
