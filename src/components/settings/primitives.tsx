import { useRef, type ReactNode } from "react";
import { Slider } from "../ui/slider";

/** iOS Settings-style rounded card with thin internal dividers */
export function Group({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <div>
      {label && (
        <div className="px-3 mb-1.5">
          {label}
        </div>
      )}
      <div className="rounded-2xl bg-white/[0.035] divide-y divide-white/[0.06] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/** Standard row: label left, control right */
export function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 min-h-[42px] py-2">
      <div className="min-w-0 shrink">
        <div className="text-[13px] text-foreground leading-tight">{label}</div>
        {hint && (
          <div className="text-[10px] text-muted-foreground/50 leading-tight mt-0.5">
            {hint}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

/** Row with inline slider + numeric readout */
export function SliderRow({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className={`px-3.5 py-2.5 space-y-1.5${disabled ? " opacity-40 pointer-events-none" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-foreground">{label}</span>
        <span className="text-[12px] text-muted-foreground tabular-nums">
          {display}
        </span>
      </div>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} />
    </div>
  );
}

/** Compact circular color swatch that opens native picker */
export function ColorCircle({
  color,
  onChange,
  size = 24,
}: {
  color: string;
  onChange: (c: string) => void;
  size?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <button
        onClick={() => ref.current?.click()}
        className="rounded-full cursor-pointer transition-transform hover:scale-110 active:scale-95"
        style={{
          backgroundColor: color,
          width: size,
          height: size,
          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.1), inset 0 0 0 1px rgba(0,0,0,0.1)",
        }}
      />
      <input
        ref={ref}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  );
}

/** Apple-style toggle switch */
export function Switch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[24px] w-[42px] shrink-0 cursor-pointer rounded-full transition-colors duration-200 ${
        checked ? "bg-primary" : "bg-white/[0.12]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[20px] w-[20px] rounded-full bg-white shadow-md transition-transform duration-200 mt-[2px] ${
          checked ? "translate-x-[20px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

/** Apple-style segmented control */
export function SegmentedControl({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="inline-flex bg-white/[0.06] rounded-lg p-[2px]">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-[5px] rounded-md text-[11px] font-medium transition-all duration-150 ${
            value === opt.value
              ? "bg-white/[0.14] text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground/70"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/** Compact dropdown styled like a pill */
export function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[28px] rounded-lg bg-white/[0.06] px-2.5 pr-6 text-[13px] text-foreground border-0 outline-none cursor-pointer"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
