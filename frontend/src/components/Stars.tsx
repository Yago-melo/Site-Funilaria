import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-neutral-600"} />
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)} data-testid="review-star-input">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          aria-label={`${i} estrela${i > 1 ? "s" : ""}`}
          className="transition-transform duration-150 hover:scale-110"
          data-testid={`review-star-${i}`}
        >
          <Star className={cn("size-8", i <= shown ? "fill-amber-400 text-amber-400" : "text-neutral-600")} />
        </button>
      ))}
    </div>
  );
}
