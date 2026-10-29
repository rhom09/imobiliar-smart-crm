import { useState } from "react";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseLeadCSV, type ImportLeadResult } from "@/lib/crm/import";
  import { useCrm } from "@/lib/crm/store";
import { brlCompact, stageLabel } from "@/lib/crm/rules";
import { cn } from "@/lib/utils";

export function ImportLeadsDialog({ onImported }: { onImported?: () => void }) {
  const { viewer, team: brokers, addLead, me } = useCrm();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseResult, setParseResult] = useState<ImportLeadResult | null>(null);
  const [ownerId, setOwnerId] = useState<string>(me?.id ?? "");

  const defaultBrokerId = viewer.kind === "broker" ? viewer.brokerId : (ownerId || me?.id || brokers[0]?.id || "");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string ?? "";
      const result = parseLeadCSV(text, defaultBrokerId);
      setParseResult(result);
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo CSV.");
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleImport() {
    if (!parseResult || parseResult.leads.length === 0) {
      toast.error("Nenhum lead válido para importar.");
      return;
    }

    const assignedOwner = viewer.kind === "broker" ? viewer.brokerId : (ownerId || me?.id || defaultBrokerId);

    let count = 0;
    for (const leadData of parseResult.leads) {
      addLead({
        ...leadData,
        ownerId: assignedOwner,
      });
      count++;
    }

    toast.success("Importação concluída", {
      description: `${count} lead${count > 1 ? "s" : ""} importado${count > 1 ? "s" : ""} com sucesso.`,
    });

    setOpen(false);
    setParseResult(null);
    setFileName("");
    onImported?.();
  }

  function resetState() {
    setParseResult(null);
    setFileName("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetState();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Upload className="mr-2 size-4" /> Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" /> Importar leads via CSV
          </DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV com os dados dos leads (colunas obrigatórias: Nome, Telefone).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {!parseResult ? (
            <div className="grid gap-4">
              {viewer.kind === "admin" && brokers.length > 0 && (
                <div className="grid gap-1.5">
                  <Label>Corretor padrão para os leads importados</Label>
                  <Select value={ownerId} onValueChange={setOwnerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o corretor" />
                    </SelectTrigger>
                    <SelectContent>
                      {brokers.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/80 p-8 text-center transition hover:border-primary/50 bg-card">
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary mb-3">
                  <Upload className="size-6" />
                </div>
                <Label htmlFor="csv-upload" className="cursor-pointer font-semibold text-sm">
                  Clique para selecionar o arquivo CSV
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Suporta arquivos .csv (delimitados por vírgula ou ponto e vírgula)
                </p>
                <Input
                  id="csv-upload"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <div className="rounded-xl bg-secondary/50 p-4 text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">Exemplo de cabeçalho suportado:</p>
                <code className="block rounded bg-background p-2 font-mono text-[11px] border">
                  Nome,Telefone,Email,Tipo,OrcamentoMin,OrcamentoMax,Quartos,Bairros,Origem,Etapa
                </code>
                <p>O sistema reconhece colunas em português ou inglês e aceita acentos.</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="flex items-center justify-between rounded-xl border bg-card p-4">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="size-8 text-primary" />
                  <div>
                    <p className="font-semibold text-sm">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {parseResult.leads.length} lead(s) válido(s) · {parseResult.errors.length} erro(s)
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetState} className="text-xs">
                  Escolher outro arquivo
                </Button>
              </div>

              {parseResult.errors.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-semibold text-xs">
                    <AlertTriangle className="size-4" />
                    Erros encontrados ({parseResult.errors.length}):
                  </div>
                  <ul className="max-h-32 overflow-y-auto space-y-1 text-xs text-destructive/90 pl-5 list-disc font-mono">
                    {parseResult.errors.map((err, i) => (
                      <li key={i}>
                        Linha {err.row}: {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parseResult.leads.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                    <CheckCircle className="size-4 text-emerald-600" />
                    Prévia dos leads válidos ({parseResult.leads.length}):
                  </Label>
                  <div className="max-h-64 overflow-y-auto rounded-xl border divide-y bg-card text-xs">
                    {parseResult.leads.map((l, i) => (
                      <div key={i} className="flex items-center justify-between p-3 gap-2">
                        <div>
                          <p className="font-semibold">{l.name}</p>
                          <p className="text-muted-foreground text-[11px]">
                            {l.phone} · {l.propertyType} · {brlCompact(l.budgetMax)} · {l.neighborhoods.join(", ")}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium">
                          {stageLabel(l.stage)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={parseResult.leads.length === 0}
                  className="rounded-full px-6"
                >
                  Importar {parseResult.leads.length} lead(s)
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
