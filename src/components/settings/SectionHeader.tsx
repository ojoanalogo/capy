import type { ReactNode, ComponentType } from "react";
import type { LucideProps } from "lucide-react";

export function SectionHeader({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
        <span className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-wider">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}
