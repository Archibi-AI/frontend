/** KMP SupportContract.kt + SupportViewModel.sendMessage — the app composes an email, so does the web. */
export const SUPPORT_EMAIL = "support@archibi.ca";
export const OTHER_TOPIC = "Others";
export const SUPPORT_TOPICS = ["Technical Issue", "Billing", "Billing & renders", "Account deletion", OTHER_TOPIC] as const;

export interface SupportMessage { name: string; topic: string; other?: string; message: string; username: string }

export function supportMailto({ name, topic, other, message, username }: SupportMessage, client = "web"): string {
  const category = topic === OTHER_TOPIC && other?.trim() ? `${OTHER_TOPIC}: ${other.trim()}` : topic;
  const subject = `[Archibi web] ${category}`;
  const body = `${message.trim()}\n\n—\nName: ${name.trim()}\nUsername: ${username}\nApp: ${client}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
