"use client";
import * as RSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { useId } from "react";

export function Select({ label, value, onValueChange, options, placeholder }: {
  label: string;
  value?: string;
  onValueChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="w-full">
      <label id={id} className="mb-1 block text-sm font-medium text-ink-2">
        {label}
      </label>
      <RSelect.Root value={value} onValueChange={onValueChange}>
        <RSelect.Trigger aria-labelledby={id} className="flex h-[46px] w-full items-center justify-between rounded-sm border border-line-strong bg-surface px-4 text-base focus:border-brand focus:shadow-focus focus:outline-none">
          <RSelect.Value placeholder={placeholder} />
          <ChevronDown className="size-4" aria-hidden />
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content position="popper" sideOffset={4} className="z-50 min-w-[var(--radix-select-trigger-width)] rounded-md bg-surface p-1 shadow-pop">
            <RSelect.Viewport>
              {options.map((o) => (
                <RSelect.Item key={o.value} value={o.value} className="flex h-10 cursor-pointer items-center justify-between rounded-sm px-3 text-sm outline-none data-[highlighted]:bg-surface-alt">
                  <RSelect.ItemText>{o.label}</RSelect.ItemText>
                  <RSelect.ItemIndicator>
                    <Check className="size-4 text-brand" aria-hidden />
                  </RSelect.ItemIndicator>
                </RSelect.Item>
              ))}
            </RSelect.Viewport>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>
    </div>
  );
}
