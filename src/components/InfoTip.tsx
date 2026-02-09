import { type ReactNode } from "react";
import { Info } from "lucide-react";

export function InfoTip({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-flex group">
      <span className="p-0.5 rounded text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors cursor-help">
        <Info className="h-3 w-3" />
      </span>
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-50 w-[200px] px-2.5 py-1.5 rounded-lg bg-popover border border-border shadow-lg text-[10px] text-muted-foreground leading-snug pointer-events-none">
        {children}
      </span>
    </span>
  );
}
