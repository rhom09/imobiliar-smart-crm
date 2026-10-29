import { toast } from "sonner";

/** Abre a folha nativa de compartilhamento; copia o link só quando o aparelho não suporta. */
export async function shareLink(data: { title: string; text?: string; url: string }) {
  const payload: ShareData = {
    title: data.title,
    url: data.url,
    ...(data.text ? { text: data.text } : {}),
  };
  if (typeof navigator !== "undefined" && navigator.share) {
    const ok = !navigator.canShare || navigator.canShare(payload);
    const final = ok ? payload : { url: data.url };
    try {
      await navigator.share(final);
      return;
    } catch (e) {
      if ((e as DOMException)?.name === "AbortError") return; // usuário fechou o menu
    }
  }
  try {
    await navigator.clipboard.writeText(data.url);
    toast.success("Link copiado");
  } catch {
    toast.error("Não foi possível compartilhar");
  }
}
