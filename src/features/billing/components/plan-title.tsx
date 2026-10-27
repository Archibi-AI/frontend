import { splitPlanTitle } from "../model/catalog";

/** "Archibi Studio" → "Archibi " + red "Studio". */
export function PlanTitle({ name, className }: { name: string; className?: string }) {
  const [head, last] = splitPlanTitle(name);
  return (
    <h3 className={className ?? "font-display text-[22px] font-semibold leading-tight text-ink-2"}>
      {head}
      {last && <span className="text-brand">{last}</span>}
    </h3>
  );
}
