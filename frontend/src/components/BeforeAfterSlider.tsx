import { useState } from "react";
import { MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  before: string;
  after: string;
  alt: string;
  className?: string;
  testId?: string;
}

export default function BeforeAfterSlider({ before, after, alt, className, testId = "before-after-slider" }: Props) {
  const [pos, setPos] = useState(50);
  return (
    <div className={cn("relative select-none overflow-hidden", className)} data-testid={testId}>
      <img src={after} alt={`${alt} — depois`} className="absolute inset-0 size-full object-cover" draggable={false} />
      <img
        src={before}
        alt={`${alt} — antes`}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        draggable={false}
      />
      <span className="absolute left-3 top-3 rounded bg-black/70 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white">Antes</span>
      <span className="absolute right-3 top-3 rounded bg-amber-500 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-black">Depois</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-amber-400" style={{ left: `${pos}%` }}>
        <span className="absolute left-1/2 top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-amber-400 bg-[#0B0D11] text-amber-400 shadow-lg">
          <MoveHorizontal className="size-4" />
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        onClick={(e) => e.stopPropagation()}
        aria-label="Comparar antes e depois"
        className="absolute inset-0 size-full cursor-ew-resize opacity-0"
        data-testid={`${testId}-range`}
      />
    </div>
  );
}
