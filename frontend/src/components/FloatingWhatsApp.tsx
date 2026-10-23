import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { useSite } from "@/lib/hooks";
import { waLink } from "@/lib/format";

export default function FloatingWhatsApp() {
  const { settings } = useSite();
  return (
    <a
      href={waLink(settings.whatsapp_number, settings.whatsapp_message)}
      target="_blank"
      rel="noreferrer"
      aria-label="Falar no WhatsApp"
      className="group fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-xl shadow-black/40 transition-transform duration-200 hover:scale-105"
      data-testid="floating-whatsapp-button"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse-ring" />
      <SiWhatsapp size={26} className="relative" />
      <span className="pointer-events-none absolute right-16 whitespace-nowrap rounded-md bg-[#131720] px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
        Fale com o funileiro
      </span>
    </a>
  );
}
