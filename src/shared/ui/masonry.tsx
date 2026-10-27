import type { ReactNode } from "react";

/** CSS-columns masonry: 2 / 3 / 4 columns at < md / md / lg (architecture/09 §4). */
export function Masonry<T>({ items, render, getKey }: { items: readonly T[]; render: (item: T) => ReactNode; getKey: (item: T) => string | number }) {
  return (
    <div className="columns-2 gap-3 md:columns-3 lg:columns-4">
      {items.map((item) => (
        <div key={getKey(item)} className="mb-3 break-inside-avoid">
          {render(item)}
        </div>
      ))}
    </div>
  );
}
