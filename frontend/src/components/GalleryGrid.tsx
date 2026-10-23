import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Expand, Images, Play } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";
import { useGallery } from "@/lib/hooks";
import type { GalleryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | "image" | "video";
const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "image", label: "Fotos" },
  { value: "video", label: "Vídeos" },
];

function Card({ item, big, onOpen }: { item: GalleryItem; big: boolean; onOpen: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-line bg-panel transition-[border-color,box-shadow] duration-300 hover:border-amber-500/70 hover:shadow-xl hover:shadow-amber-500/10",
        big ? "min-h-[320px] md:col-span-2 md:row-span-2 md:min-h-[520px]" : "min-h-[250px]",
      )}
      data-testid={`gallery-card-${item.id}`}
    >
      {item.type === "image" && item.before_url ? (
        <BeforeAfterSlider before={item.before_url} after={item.media_url} alt={item.title} className="absolute inset-0" testId={`gallery-slider-${item.id}`} />
      ) : item.type === "video" ? (
        <video src={item.media_url} muted playsInline preload="metadata" className="absolute inset-0 size-full object-cover" />
      ) : (
        <img src={item.media_url} alt={item.title} loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      {item.type === "video" && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-amber-500 text-black shadow-2xl transition-transform duration-300 group-hover:scale-110">
          <Play className="ml-1 size-7 fill-black" />
        </span>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-amber-400">
          {item.type === "video" ? "Vídeo · " : ""}{item.category}
        </span>
        <h3 className={cn("mt-1 font-heading font-semibold text-white", big ? "text-2xl" : "text-lg")}>{item.title}</h3>
        {big && item.description && <p className="mt-1 max-w-md text-sm text-neutral-300">{item.description}</p>}
      </div>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ampliar ${item.title}`}
        className="absolute right-3 top-12 grid size-9 place-items-center rounded-md bg-black/60 text-white opacity-90 backdrop-blur transition-colors duration-200 hover:bg-amber-500 hover:text-black md:opacity-0 md:group-hover:opacity-100"
        data-testid={`gallery-open-${item.id}`}
      >
        <Expand className="size-4" />
      </button>
      {item.type === "video" && (
        <button type="button" onClick={onOpen} aria-label={`Assistir ${item.title}`} className="absolute inset-0" data-testid={`gallery-play-${item.id}`} />
      )}
    </motion.div>
  );
}

export default function GalleryGrid() {
  const { data, isLoading, isError } = useGallery();
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<GalleryItem | null>(null);
  const items = useMemo(() => (isError ? [] : (data ?? [])).filter((i) => filter === "all" || i.type === filter), [data, isError, filter]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-2" role="tablist" data-testid="gallery-filters">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors duration-200",
              filter === f.value ? "border-amber-500 bg-amber-500 text-black" : "border-line text-neutral-300 hover:border-amber-500/60",
            )}
            data-testid={`gallery-filter-${f.value}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-panel" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-4 rounded-xl border border-dashed border-line p-10 text-neutral-400" data-testid="gallery-empty">
          <Images className="size-8 text-amber-400" />
          <p>Nenhum trabalho publicado nesta categoria ainda. Em breve novas fotos e vídeos!</p>
        </div>
      ) : (
        <div className="grid auto-rows-auto grid-cols-1 gap-5 md:grid-cols-3" data-testid="gallery-grid">
          {items.map((item, idx) => (
            <Card key={item.id} item={item} big={idx === 0} onOpen={() => setActive(item)} />
          ))}
        </div>
      )}

      <Dialog open={active !== null} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-4xl gap-0 overflow-hidden border-line bg-[#0B0D11] p-0 sm:max-w-4xl" data-testid="gallery-dialog">
          {active && (
            <>
              <div className="relative aspect-video w-full bg-black">
                {active.type === "video" ? (
                  <video src={active.media_url} controls autoPlay playsInline className="size-full" data-testid="gallery-dialog-video" />
                ) : active.before_url ? (
                  <BeforeAfterSlider before={active.before_url} after={active.media_url} alt={active.title} className="size-full" testId="gallery-dialog-slider" />
                ) : (
                  <img src={active.media_url} alt={active.title} className="size-full object-contain" data-testid="gallery-dialog-image" />
                )}
              </div>
              <div className="p-5">
                <DialogTitle className="font-heading text-xl text-white">{active.title}</DialogTitle>
                <DialogDescription className="mt-1 text-neutral-400">
                  {active.category}{active.description ? ` — ${active.description}` : ""}
                </DialogDescription>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
