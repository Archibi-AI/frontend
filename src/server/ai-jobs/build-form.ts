import { OPTIONAL_PARAMS, type Service } from "@/features/ai/schemas";

const REDESIGN_TYPE: Record<string, string> = { interior: "Interior", exterior: "Exterior", landscape: "Garden" };
const MODEL: Record<string, string> = { beautiful: "Beautiful Redesign", creative: "Creative Redesign" };
const TEXT_FIELDS = ["roomType", "designStyle", "houseAngle", "prompt", "gardenType"] as const;

export interface StartInput {
  service: Service;
  mode: "beautiful" | "creative";
  sketchPart?: "Interior" | "Exterior" | "Landscape";
  values: Record<string, string>;
  file: File;
}

/** The Django multipart, field for field like the app's builders (data/network/helper.kt:20-101). */
export function buildDjangoForm(input: StartInput): FormData {
  const v = input.values;
  const form = new FormData();
  const optionalPicked = OPTIONAL_PARAMS.filter((p) => v[p]);
  if (input.service === "furniture") {
    form.append("beforeImage", input.file, input.file.name);
    return form;
  }
  if (input.service === "sketch") {
    // buildSketchToRenderProcessMultipart: only non-empty fields, no `model`.
    for (const f of TEXT_FIELDS) if (v[f]) form.append(f, v[f]);
    if (input.sketchPart) form.append("designType", input.sketchPart);
    for (const p of optionalPicked) form.append(p, v[p]!);
    form.append("beforeImage", input.file, input.file.name);
    return form;
  }
  // buildSubmitMultipart: these seven are always appended ("" when unset), then optional ids, then the image.
  for (const f of ["roomType", "designStyle", "houseAngle", "prompt"] as const) form.append(f, v[f] ?? "");
  form.append("designType", REDESIGN_TYPE[input.service]!);
  form.append("gardenType", v.gardenType ?? "");
  form.append("model", MODEL[input.mode]!);
  for (const p of optionalPicked) form.append(p, v[p]!);
  form.append("beforeImage", input.file, input.file.name);
  return form;
}
