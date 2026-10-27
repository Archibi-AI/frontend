"use client";
import { Mail } from "lucide-react";
import { useState } from "react";
import { routes } from "@/shared/config/routes";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Select } from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";
import { useToast } from "@/shared/ui/toast";
import { OTHER_TOPIC, SUPPORT_EMAIL, SUPPORT_TOPICS, supportMailto } from "../model/support";

const REQUIRED = "Required";

/** Mirrors SupportScreen: no API — the app opens the mail client; so do we (with a copy fallback). */
export function SupportForm({ username, defaultName }: { username: string; defaultName: string }) {
  const toast = useToast();
  const [name, setName] = useState(defaultName);
  const [topic, setTopic] = useState<string>();
  const [other, setOther] = useState("");
  const [message, setMessage] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const valid = name.trim() && topic && message.trim() && (topic !== OTHER_TOPIC || other.trim());
  const mailto = () => supportMailto({ name, topic: topic ?? "", other, message, username });

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setShowErrors(true);
    window.location.href = mailto();
  }
  async function copy() {
    if (!valid) return setShowErrors(true);
    await navigator.clipboard.writeText(decodeURIComponent(mailto().split("body=")[1] ?? ""));
    toast({ kind: "info", title: "Message copied", description: `Paste it into an email to ${SUPPORT_EMAIL}.` });
  }

  return (
    <div className="max-w-xl">
      <section className="mb-8 rounded-md border border-line bg-surface p-6">
        <h2 className="font-display text-lg font-medium text-ink-2">How can we help?</h2>
        <p className="mt-1 text-[15px] text-subtle">Tell us what&apos;s going on and we&apos;ll reply by email. Include as much detail as you can so we can help faster.</p>
        <a href={routes.wordpress.faq} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">Read the FAQ first</a>
      </section>
      <form onSubmit={send} noValidate className="space-y-5">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={showErrors && !name.trim() ? REQUIRED : undefined} />
        <div>
          <Select label="Topic" value={topic} onValueChange={setTopic} placeholder="Choose a topic" options={SUPPORT_TOPICS.map((t) => ({ value: t, label: t }))} />
          {showErrors && !topic && <p role="alert" className="mt-1 text-sm text-danger">{REQUIRED}</p>}
        </div>
        {topic === OTHER_TOPIC && <Input label="Please specify" value={other} onChange={(e) => setOther(e.target.value)} error={showErrors && !other.trim() ? REQUIRED : undefined} />}
        <Textarea label="Message" value={message} onChange={(e) => setMessage(e.target.value)} error={showErrors && !message.trim() ? REQUIRED : undefined} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit"><Mail className="size-4" aria-hidden /> Send email</Button>
          <Button type="button" variant="secondary" onClick={copy}>Copy message</Button>
        </div>
      </form>
    </div>
  );
}
