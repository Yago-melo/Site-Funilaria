import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, MessageSquareOff, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Stars } from "@/components/Stars";
import { apiDelete, apiGet, apiPatch, errorMessage } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { Review, ReviewStatus, ReviewStatusUpdate } from "@/lib/types";
import { cn } from "@/lib/utils";

const LABEL: Record<ReviewStatus, string> = { pendente: "Pendente", aprovado: "Publicado", rejeitado: "Rejeitado" };
const CLS: Record<ReviewStatus, string> = {
  pendente: "bg-amber-500/15 text-amber-300",
  aprovado: "bg-emerald-500/15 text-emerald-300",
  rejeitado: "bg-red-500/15 text-red-300",
};

export default function ReviewsTab() {
  const [filter, setFilter] = useState<ReviewStatus | "todos">("pendente");
  const q = useQuery({
    queryKey: ["admin-reviews", filter],
    queryFn: () => apiGet<Review[]>(filter === "todos" ? "/admin/reviews" : `/admin/reviews?status=${filter}`),
  });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    queryClient.invalidateQueries({ queryKey: ["reviews"] });
  };
  const moderate = useMutation({
    mutationFn: ({ id, body }: { id: string; body: ReviewStatusUpdate }) => apiPatch<Review>(`/admin/reviews/${id}`, body),
    onSuccess: (r) => { toast.success(r.status === "aprovado" ? "Avaliação publicada no site." : "Avaliação rejeitada."); refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiDelete<{ ok: boolean }>(`/admin/reviews/${id}`),
    onSuccess: () => { toast.success("Avaliação excluída."); refresh(); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const rows = q.isError ? [] : (q.data ?? []);

  return (
    <div className="space-y-4" data-testid="admin-reviews">
      <div className="flex flex-wrap gap-2">
        {(["pendente", "aprovado", "rejeitado", "todos"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={cn("rounded-full border px-3.5 py-1 text-sm transition-colors duration-200", filter === f ? "border-amber-500 bg-amber-500 text-black" : "border-line text-neutral-300 hover:border-amber-500/60")}
            data-testid={`admin-reviews-filter-${f}`}>
            {f === "todos" ? "Todas" : f === "aprovado" ? "Publicadas" : f === "pendente" ? "Pendentes" : "Rejeitadas"}
          </button>
        ))}
      </div>
      {q.isLoading ? (
        <div className="flex items-center gap-2 text-neutral-400"><Loader2 className="size-4 animate-spin" /> Carregando...</div>
      ) : rows.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-line p-10 text-neutral-400" data-testid="admin-reviews-empty">
          <MessageSquareOff className="size-6 text-amber-400" /> Nenhuma avaliação neste filtro.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-col rounded-xl border border-line bg-panel p-5" data-testid={`admin-review-${r.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Stars value={r.rating} />
                  <p className="mt-2 font-semibold text-white">{r.customer_name}{r.car_model && <span className="font-normal text-neutral-500"> · {r.car_model}</span>}</p>
                  <p className="text-xs text-neutral-500">{new Date(r.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge className={CLS[r.status]}>{LABEL[r.status]}</Badge>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-300">“{r.comment}”</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status !== "aprovado" && (
                  <Button size="sm" onClick={() => moderate.mutate({ id: r.id, body: { status: "aprovado" } })} data-testid={`admin-review-approve-${r.id}`}>
                    <Check className="size-4" /> Aprovar
                  </Button>
                )}
                {r.status !== "rejeitado" && (
                  <Button size="sm" variant="outline" onClick={() => moderate.mutate({ id: r.id, body: { status: "rejeitado" } })} data-testid={`admin-review-reject-${r.id}`}>
                    <X className="size-4" /> {r.status === "aprovado" ? "Tirar do site" : "Rejeitar"}
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="text-neutral-400 hover:text-red-400" aria-label="Excluir avaliação"
                  onClick={() => { if (window.confirm("Excluir esta avaliação?")) remove.mutate(r.id); }} data-testid={`admin-review-delete-${r.id}`}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
