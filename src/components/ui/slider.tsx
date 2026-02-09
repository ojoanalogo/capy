import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  defaultValue?: number;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, min = 0, max = 100, step = 1, onChange, defaultValue, ...props }, ref) => {
    return (
      <input
        type="range"
        ref={ref}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onDoubleClick={() => {
          if (defaultValue !== undefined) onChange(defaultValue);
        }}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary",
          className,
        )}
        {...props}
      />
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
