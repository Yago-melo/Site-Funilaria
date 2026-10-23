import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Archive, Inbox, Loader2, Save } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch, errorMessage } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { fmtPhone, waLink } from "@/lib/format";
import type { Quote, QuoteReply, QuoteStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL: Record<QuoteStatus, string> = { novo: "Novo", respondido: "Respondido", agendado: "Agendado", arquivado: "Arquivado" };
const CLS: Record<QuoteStatus, string> = {
  novo: "bg-amber-500/15 text-amber-300",
  respondido: "bg-emerald-500/15 text-emerald-300",
  agendado: "bg-sky-500/15 text-sky-300",
  arquivado: "bg-neutral-500/15 text-neutral-400",
};
const FILTERS: { value: QuoteStatus | "todos"; label: string }[] = [
  { value: "novo", label: "Novos" }, { value: "respondido", label: "Respondidos" },
  { value: "agendado", label: "Agendados" }, { value: "arquivado", label: "Arquivados" }, { value: "todos", label: "Todos" },
];

function QuoteCard({ quote }: { quote: Quote }) {
  const [price, setPrice] = useState(quote.price_quote);
  const [reply, setReply] = useState(quote.owner_reply);
  const [photo, setPhoto] = useState(0);

  const save = useMutation({
    mutationFn: (body: QuoteReply) => apiPatch<Quote>(`/admin/quotes/${quote.id}`, body),
    onSuccess: (q) => {
      toast.success(`Orçamento ${LABEL[q.status].toLowerCase()}.`);
      queryClient.invalidateQueries({ queryKey: ["admin-quotes"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const first = quote.customer_name.split(" ")[0];
  const track = `${window.location.origin}/orcamento/${quote.id}`;
  const message = `Olá ${first}! Aqui é da Nadis Car. Avaliamos as fotos do seu ${quote.car_model}.\nValor: ${price || "a combinar"}\n${reply ? reply + "\n" : ""}Para agendar: ${window.location.origin}/agendar\nDetalhes: ${track}`;
  const waUrl = waLink(quote.customer_phone.length <= 11 ? `55${quote.customer_phone}` : quote.customer_phone, message);

  return (
    <div className="grid gap-6 rounded-xl border border-line bg-panel p-5 md:grid-cols-[280px_1fr]" data-testid={`admin-quote-${quote.id}`}>
      <div>
        <a href={quote.photos[photo]} target="_blank" rel="noreferrer" className="block aspect-[4/3] overflow-hidden rounded-lg bg-black">
          <img src={quote.photos[photo]} alt={`Foto ${photo + 1}`} className="size-full object-cover" data-testid={`admin-quote-photo-${quote.id}`} />
        </a>
        {quote.photos.length > 1 && (
          <div className="mt-2 flex gap-2">
            {quote.photos.map((p, i) => (
              <button key={p} type="button" onClick={() => setPhoto(i)} className={cn("size-12 overflow-hidden rounded border-2", i === photo ? "border-amber-500" : "border-transparent opacity-60")} aria-label={`Ver foto ${i + 1}`}>
                <img src={p} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-heading text-lg font-semibold text-white">{quote.customer_name}</p>
            <p className="text-sm text-neutral-400">{quote.car_model} · <span className="font-mono">{fmtPhone(quote.customer_phone)}</span></p>
            <p className="mt-0.5 text-xs text-neutral-500">{new Date(quote.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
          </div>
          <Badge className={CLS[quote.status]} data-testid={`admin-quote-status-${quote.id}`}>{LABEL[quote.status]}</Badge>
        </div>
        {quote.description && <p className="rounded-lg bg-[#0B0D11] p-3 text-sm text-neutral-300">{quote.description}</p>}
        <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
          <div className="space-y-1.5">
            <Label htmlFor={`qp-${quote.id}`}>Valor</Label>
            <Input id={`qp-${quote.id}`} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex.: R$ 250,00" data-testid={`admin-quote-price-${quote.id}`} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`qr-${quote.id}`}>Mensagem ao cliente</Label>
            <Textarea id={`qr-${quote.id}`} value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Ex.: Fica pronto no mesmo dia, sem repintura." data-testid={`admin-quote-reply-${quote.id}`} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => save.mutate({ price_quote: price, owner_reply: reply, status: "respondido" })} disabled={save.isPending || (!price && !reply)} data-testid={`admin-quote-save-${quote.id}`}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar resposta
          </Button>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => { if (quote.status === "novo" && (price || reply)) save.mutate({ price_quote: price, owner_reply: reply, status: "respondido" }); }}
            className="inline-flex h-7 items-center gap-1.5 rounded-md bg-[#25D366] px-2.5 text-[0.8rem] font-semibold text-white transition-colors duration-200 hover:bg-[#1fb857]"
            data-testid={`admin-quote-whatsapp-${quote.id}`}
          >
            <SiWhatsapp size={13} /> Responder no WhatsApp
          </a>
          {quote.status !== "agendado" && (
            <Button size="sm" variant="outline" onClick={() => save.mutate({ price_quote: price, owner_reply: reply, status: "agendado" })} data-testid={`admin-quote-booked-${quote.id}`}>Marcar como agendado</Button>
          )}
          {quote.status !== "arquivado" && (
            <Button size="sm" variant="ghost" onClick={() => save.mutate({ price_quote: price, owner_reply: reply, status: "arquivado" })} data-testid={`admin-quote-archive-${quote.id}`}>
              <Archive className="size-4" /> Arquivar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function QuotesTab() {
  const [filter, setFilter] = useState<QuoteStatus | "todos">("novo");
  const q = useQuery({
    queryKey: ["admin-quotes", filter],
    queryFn: () => apiGet<Quote[]>(filter === "todos" ? "/admin/quotes" : `/admin/quotes?status=${filter}`),
  });
  const rows = q.isError ? [] : (q.data ?? []);

  return (
    <div className="space-y-4" data-testid="admin-quotes">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.value} type="button" onClick={() => setFilter(f.value)}
            className={cn("rounded-full border px-3.5 py-1 text-sm transition-colors duration-200", filter === f.value ? "border-amber-500 bg-amber-500 text-black" : "border-line text-neutral-300 hover:border-amber-500/60")}
            data-testid={`admin-quotes-filter-${f.value}`}>
            {f.label}
          </button>
        ))}
      </div>
      {q.isLoading ? (
        <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="size-4 animate-spin" /> Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-line p-10 text-neutral-400" data-testid="admin-quotes-empty">
          <Inbox className="size-6 text-amber-400" /> Nenhum pedido de orçamento neste filtro.
        </div>
      ) : (
        rows.map((quote) => <QuoteCard key={`${quote.id}-${quote.status}`} quote={quote} />)
      )}
    </div>
  );
}
