import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Loader2, MessageSquareQuote, PenLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StarInput, Stars } from "@/components/Stars";
import { apiGet, apiPost, errorMessage } from "@/lib/api";
import type { Review, ReviewCreate, ReviewsSummary } from "@/lib/types";

const EMPTY: ReviewCreate = { customer_name: "", rating: 0, comment: "", car_model: "" };

function ReviewForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState<ReviewCreate>(EMPTY);
  const send = useMutation({
    mutationFn: (body: ReviewCreate) => apiPost<Review>("/reviews", body),
    onSuccess: () => { toast.success("Obrigado! Sua avaliação será publicada após aprovação."); setForm(EMPTY); onDone(); },
    onError: (err) => toast.error(errorMessage(err)),
  });
  const valid = form.customer_name.trim().length >= 2 && form.rating > 0 && form.comment.trim().length >= 5;

  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) send.mutate(form); }} className="space-y-4" data-testid="review-form">
      <div className="space-y-2">
        <Label>Sua nota *</Label>
        <StarInput value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="r-name">Seu nome *</Label>
          <Input id="r-name" value={form.customer_name} onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))} maxLength={60} data-testid="review-name-input" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-car">Seu carro</Label>
          <Input id="r-car" value={form.car_model} onChange={(e) => setForm((f) => ({ ...f, car_model: e.target.value }))} placeholder="Ex.: Onix 2022" maxLength={60} data-testid="review-car-input" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-comment">Como foi o serviço? *</Label>
        <Textarea id="r-comment" value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} rows={4} maxLength={600} data-testid="review-comment-input" />
      </div>
      <Button type="submit" className="h-10 w-full font-semibold" disabled={!valid || send.isPending} data-testid="review-submit-button">
        {send.isPending && <Loader2 className="size-4 animate-spin" />} Enviar avaliação
      </Button>
    </form>
  );
}

export default function ReviewsSection() {
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ["reviews"], queryFn: () => apiGet<ReviewsSummary>("/reviews") });
  const data = q.data && !q.isError ? q.data : undefined;

  return (
    <section id="avaliacoes" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8" data-testid="reviews-section">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Avaliações</p>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">O que dizem nossos clientes</h2>
          {data && data.count > 0 ? (
            <div className="mt-6 flex items-end gap-4" data-testid="reviews-average">
              <span className="font-mono text-6xl font-semibold leading-none text-white">{data.average.toFixed(1).replace(".", ",")}</span>
              <div className="pb-1">
                <Stars value={data.average} size={18} />
                <p className="mt-1 text-sm text-neutral-400">{data.count} avaliação{data.count > 1 ? "ões" : ""}</p>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-neutral-400">Ainda não temos avaliações publicadas. Já fez um serviço com a gente? Conte como foi!</p>
          )}
          <Button variant="outline" className="mt-8 h-11 border-amber-500/50 px-5 text-amber-300 hover:bg-amber-500/10" onClick={() => setOpen(true)} data-testid="reviews-open-form-button">
            <PenLine className="size-4" /> Deixar minha avaliação
          </Button>
        </div>
        <div className="lg:col-span-8">
          {data && data.items.length > 0 ? (
            <div className="columns-1 gap-5 md:columns-2" data-testid="reviews-list">
              {data.items.slice(0, 8).map((r, i) => (
                <motion.figure
                  key={r.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="mb-5 break-inside-avoid rounded-xl border border-line bg-panel p-6"
                  data-testid={`review-card-${r.id}`}
                >
                  <Stars value={r.rating} />
                  <blockquote className="mt-4 leading-relaxed text-neutral-200">“{r.comment}”</blockquote>
                  <figcaption className="mt-4 text-sm">
                    <span className="font-semibold text-white">{r.customer_name}</span>
                    {r.car_model && <span className="text-neutral-500"> · {r.car_model}</span>}
                  </figcaption>
                </motion.figure>
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-48 items-center gap-4 rounded-xl border border-dashed border-line p-10 text-neutral-400" data-testid="reviews-empty">
              <MessageSquareQuote className="size-8 shrink-0 text-amber-400" />
              <p>Seja o primeiro a avaliar o trabalho da Nadis Car.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-line bg-[#0B0D11] sm:max-w-lg" data-testid="review-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-white">Avalie nosso serviço</DialogTitle>
            <DialogDescription>Sua avaliação aparece no site depois de aprovada pela oficina.</DialogDescription>
          </DialogHeader>
          <ReviewForm onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </section>
  );
}
