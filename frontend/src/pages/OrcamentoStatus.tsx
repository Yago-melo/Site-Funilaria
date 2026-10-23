import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Clock, Loader2, SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { apiGet } from "@/lib/api";
import type { QuotePublic } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function OrcamentoStatus() {
  const { id = "" } = useParams();
  const q = useQuery({ queryKey: ["quote", id], queryFn: () => apiGet<QuotePublic>(`/quotes/${id}`), retry: false });
  const quote = q.data && !q.isError ? q.data : undefined;
  const answered = quote && quote.status !== "novo";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Seu orçamento</p>
        <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight text-white">Acompanhar orçamento</h1>
        <div className="mt-10 rounded-2xl border border-line bg-panel p-8" data-testid="quote-status-card">
          {q.isLoading ? (
            <p className="flex items-center gap-2 text-neutral-400"><Loader2 className="size-4 animate-spin" /> Carregando...</p>
          ) : !quote ? (
            <p className="flex items-center gap-3 text-neutral-400" data-testid="quote-status-not-found"><SearchX className="size-6 text-amber-400" /> Orçamento não encontrado. Confira o link recebido.</p>
          ) : !answered ? (
            <div data-testid="quote-status-waiting">
              <span className="grid size-12 place-items-center rounded-full bg-amber-500/15 text-amber-400"><Clock className="size-6" /></span>
              <h2 className="mt-5 font-heading text-2xl font-semibold text-white">Aguardando avaliação</h2>
              <p className="mt-2 text-neutral-400">Olá {quote.customer_name.split(" ")[0]}, o funileiro ainda está analisando as fotos do seu {quote.car_model}. Volte mais tarde ou aguarde o contato no WhatsApp.</p>
            </div>
          ) : (
            <div data-testid="quote-status-answered">
              <p className="text-sm text-neutral-400">{quote.customer_name} · {quote.car_model}</p>
              <p className="mt-4 text-xs uppercase tracking-widest text-neutral-500">Valor estimado</p>
              <p className="mt-1 font-heading text-4xl font-bold text-amber-400" data-testid="quote-status-price">{quote.price_quote || "Sob avaliação presencial"}</p>
              {quote.owner_reply && <p className="mt-5 whitespace-pre-line leading-relaxed text-neutral-200" data-testid="quote-status-reply">{quote.owner_reply}</p>}
              <Link to="/agendar" className={cn(buttonVariants({ size: "lg" }), "mt-8 h-12 px-6 font-semibold")} data-testid="quote-status-agendar-button">
                <CalendarCheck className="size-5" /> Agendar o serviço
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
