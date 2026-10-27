import { routes } from "@/shared/config/routes";

/** purchasePolicyMessage: the app links "Terms of Service" and "Privacy Policy" under every buy button. */
export function PolicyNote() {
  const link = "underline underline-offset-2 hover:text-brand";
  return (
    <p className="text-center text-[11px] text-subtle">
      By continuing you agree to our{" "}
      <a className={link} href={routes.wordpress.terms} target="_blank" rel="noopener noreferrer">Terms of Service</a> and{" "}
      <a className={link} href={routes.wordpress.privacy} target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
    </p>
  );
}
