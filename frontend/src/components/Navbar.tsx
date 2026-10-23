import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Menu } from "lucide-react";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSite } from "@/lib/hooks";
import { waLink } from "@/lib/format";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#servicos", label: "Serviços" },
  { href: "/#trabalhos", label: "Trabalhos" },
  { href: "/#avaliacoes", label: "Avaliações" },
  { href: "/orcamento", label: "Orçamento por foto" },
  { href: "/#contato", label: "Contato" },
];

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group flex items-center gap-3", className)} data-testid="nav-brand-link">
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-md border border-gold/40 bg-gradient-to-br from-amber-400 to-amber-700 font-heading text-lg font-black text-black">
        N
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/40 animate-sheen" />
      </span>
      <span className="leading-tight">
        <span className="block font-heading text-[15px] font-bold tracking-tight text-white">Nadis Car</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-400/90">Martelinho de Ouro</span>
      </span>
    </Link>
  );
}

export default function Navbar() {
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const wa = waLink(settings.whatsapp_number, settings.whatsapp_message);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D11]/85 backdrop-blur-xl" data-testid="site-navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <BrandMark />
        <nav className="hidden items-center gap-6 lg:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-neutral-400 transition-colors duration-200 hover:text-amber-400"
              data-testid={`nav-link-${l.href.replace(/^\/#?/, "")}`}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-[#25D366] hover:bg-[#25D366]/10 hover:text-[#25D366]")}
            data-testid="nav-whatsapp-button"
          >
            <SiWhatsapp size={15} /> WhatsApp
          </a>
          <Link
            to="/agendar"
            className={cn(buttonVariants({ size: "sm" }), "font-semibold transition-transform duration-200 hover:-translate-y-0.5")}
            data-testid="nav-agendar-button"
          >
            <CalendarCheck className="size-4" /> Agendar
          </Link>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "lg:hidden")}
            aria-label="Abrir menu"
            data-testid="nav-mobile-menu-button"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-[#0B0D11] p-6">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="mt-8 flex flex-col gap-5">
              {LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-heading text-lg text-neutral-200 hover:text-amber-400">
                  {l.label}
                </a>
              ))}
              <Link to="/agendar" onClick={() => setOpen(false)} className={cn(buttonVariants(), "mt-4")} data-testid="nav-mobile-agendar-button">
                <CalendarCheck className="size-4" /> Agendar horário
              </Link>
              <a href={wa} target="_blank" rel="noreferrer" className={cn(buttonVariants({ variant: "outline" }), "border-[#25D366]/50 text-[#25D366]")}>
                <SiWhatsapp size={15} /> WhatsApp
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
