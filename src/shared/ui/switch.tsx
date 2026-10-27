"use client";
import * as RSwitch from "@radix-ui/react-switch";

export function Switch({ label, checked, onCheckedChange }: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-ink-3">
      {label}
      <RSwitch.Root checked={checked} onCheckedChange={onCheckedChange} className="relative h-6 w-11 rounded-pill bg-track data-[state=checked]:bg-brand">
        <RSwitch.Thumb className="block size-5 translate-x-0.5 rounded-pill bg-surface shadow-card transition-transform data-[state=checked]:translate-x-[22px]" />
      </RSwitch.Root>
    </label>
  );
}
