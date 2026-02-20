"use client";

import { SWATCHES } from "@/lib/constants";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((swatch) => {
        const isSelected = value === swatch.hex;
        return (
          <button
            key={swatch.hex}
            type="button"
            title={swatch.label}
            onClick={() => onChange(swatch.hex)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              isSelected
                ? "border-white scale-110 ring-2 ring-white/40"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: swatch.hex }}
          />
        );
      })}
    </div>
  );
}
