import { Clock, Mail, MapPin } from "lucide-react";
import { SiInstagram, SiWhatsapp } from "@icons-pack/react-simple-icons";
import { Link } from "react-router-dom";
import { BrandMark } from "@/components/Navbar";
import { useSite } from "@/lib/hooks";
import { WEEKDAYS, fmtPhone, waLink } from "@/lib/format";

export default function Footer() {
  const { settings } = useSite();
  const days = settings.work_days.length
    ? `${WEEKDAYS[Math.min(...settings.work_days)]} a ${WEEKDAYS[Math.max(...settings.work_days)]}`
    : "Sob consulta";

  return (
    <footer id="contato" className="relative border-t border-line bg-[#080A0E]" data-testid="site-footer">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-12 lg:px-8">
        <div className="md:col-span-5">
          <BrandMark />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-neutral-400">{settings.tagline}</p>
          <div className="mt-6 flex gap-3">
            <a
              href={waLink(settings.whatsapp_number, settings.whatsapp_message)}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="grid size-10 place-items-center rounded-md border border-line text-[#25D366] transition-colors duration-200 hover:border-[#25D366]"
              data-testid="footer-whatsapp-link"
            >
              <SiWhatsapp size={18} />
            </a>
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid size-10 place-items-center rounded-md border border-line text-neutral-300 transition-colors duration-200 hover:border-amber-400"
                data-testid="footer-instagram-link"
              >
                <SiInstagram size={18} />
              </a>
            )}
          </div>
        </div>
        <div className="space-y-4 text-sm md:col-span-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Contato</p>
          <p className="flex items-start gap-3 text-neutral-300" data-testid="footer-address">
            <MapPin className="mt-0.5 size-4 shrink-0 text-amber-400" /> {settings.address} — {settings.city}
          </p>
          <p className="flex items-center gap-3 text-neutral-300" data-testid="footer-phone">
            <SiWhatsapp size={15} className="shrink-0 text-[#25D366]" /> {fmtPhone(settings.whatsapp_number)}
          </p>
          <p className="flex items-center gap-3 text-neutral-300" data-testid="footer-email">
            <Mail className="size-4 shrink-0 text-amber-400" /> {settings.email}
          </p>
        </div>
        <div className="space-y-4 text-sm md:col-span-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">Horário</p>
          <p className="flex items-center gap-3 text-neutral-300" data-testid="footer-hours">
            <Clock className="size-4 shrink-0 text-amber-400" /> {days} · {settings.open_time}–{settings.close_time}
          </p>
          <Link to="/agendar" className="inline-block font-semibold text-amber-400 hover:underline" data-testid="footer-agendar-link">
            Agendar online →
          </Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-xs text-neutral-500 sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} {settings.business_name}. Todos os direitos reservados.</span>
          <Link to="/admin" className="hover:text-neutral-300" data-testid="footer-admin-link">
            Área do funileiro
          </Link>
        </div>
      </div>
    </footer>
  );
}
