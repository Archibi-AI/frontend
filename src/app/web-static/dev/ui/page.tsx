"use client";
import { useState } from "react";
import { Container } from "@/shared/layout/container";
import { Avatar } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Chip } from "@/shared/ui/chip";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { EmptyState } from "@/shared/ui/empty-state";
import { ErrorState } from "@/shared/ui/error-state";
import { ImageDropzone } from "@/shared/ui/image-dropzone";
import { Input } from "@/shared/ui/input";
import { PasswordInput } from "@/shared/ui/password-input";
import { Select } from "@/shared/ui/select";
import { MasonrySkeleton } from "@/shared/ui/skeleton";
import { Switch } from "@/shared/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Textarea } from "@/shared/ui/textarea";
import { useToast } from "@/shared/ui/toast";

/** Dev-only component gallery (F02). The production build serves a 404 here. */
export default function UiGallery() {
  const toast = useToast();
  const [chip, setChip] = useState("Modern");
  const [on, setOn] = useState(true);
  const [topic, setTopic] = useState<string>();
  if (process.env.NODE_ENV === "production") return <EmptyState title="Page not found" />;
  return (
    <Container className="space-y-10 py-10">
      <h1 className="font-display text-3xl font-bold">UI kit</h1>
      <section className="flex flex-wrap gap-3">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button loading>Loading</Button>
        <Button size="sm">Small</Button>
        <Button onClick={() => toast({ kind: "success", title: "Account is updated successfully!" })}>Toast</Button>
      </section>
      <section className="flex flex-wrap gap-2">
        {["Modern", "Scandinavian", "Minimal"].map((t) => (
          <Chip key={t} selected={chip === t} onClick={() => setChip(t)}>{t}</Chip>
        ))}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <Input label="Email" type="email" placeholder="you@example.com" />
        <PasswordInput label="Password" error="Your entered password is wrong." />
        <Textarea label="Message" />
        <Select label="Topic" value={topic} onValueChange={setTopic} placeholder="Choose" options={["Technical Issue", "Billing", "Others"].map((v) => ({ value: v, label: v }))} />
        <Switch label="Notifications" checked={on} onCheckedChange={setOn} />
        <div className="flex items-center gap-3"><Avatar name="Abtin Zandi" /><Avatar name="x" src={null} /></div>
      </section>
      <Tabs defaultValue="interior">
        <TabsList label="Gallery type">
          <TabsTrigger value="interior">Interior</TabsTrigger>
          <TabsTrigger value="exterior">Exterior</TabsTrigger>
          <TabsTrigger value="landscape">Landscape</TabsTrigger>
        </TabsList>
        <TabsContent value="interior" className="pt-4"><MasonrySkeleton count={8} /></TabsContent>
        <TabsContent value="exterior" className="pt-4"><EmptyState title="No ideas here yet." /></TabsContent>
        <TabsContent value="landscape" className="pt-4"><ErrorState message="server is down!" onRetry={() => undefined} /></TabsContent>
      </Tabs>
      <Card className="p-6"><ImageDropzone onFile={() => undefined} /></Card>
      <Dialog>
        <DialogTrigger asChild><Button variant="secondary">Open dialog</Button></DialogTrigger>
        <DialogContent><DialogTitle>Dialog</DialogTitle><p className="mt-3 text-sm text-muted">Bottom sheet on mobile, centered on desktop.</p></DialogContent>
      </Dialog>
    </Container>
  );
}
