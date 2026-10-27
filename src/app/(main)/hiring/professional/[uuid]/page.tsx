import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isUuid, ProjectTile, WishlistButton } from "@/features/hiring";
import { Breadcrumbs } from "@/features/hiring/components/breadcrumbs";
import { recallProfessional } from "@/features/hiring/server/card-cache";
import { getProfessionalPage } from "@/features/hiring/server/repository";
import { AppError } from "@/shared/errors/app-error";
import { routes } from "@/shared/config/routes";
import { Avatar } from "@/shared/ui/avatar";
import { RemoteImage } from "@/shared/ui/remote-image";

type Params = Promise<{ uuid: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const card = await recallProfessional((await params).uuid);
  return card ? { title: `${card.fullname} — ${card.profession ?? "Professional"}`, description: card.about ?? undefined } : { title: "Professional", robots: { index: false } };
}

/** pro_page: banner, tags, description, contacts and the first projects (H5). Card data comes from the Redis card cache (D21). */
export default async function ProfessionalPage({ params }: { params: Params }) {
  const { uuid } = await params;
  if (!isUuid(uuid)) notFound();
  const [page, card] = await Promise.all([
    getProfessionalPage(uuid).catch((e) => {
      if (e instanceof AppError && (e.code === "NOT_FOUND" || e.status === 404)) notFound();
      throw e;
    }),
    recallProfessional(uuid),
  ]);
  const name = card?.fullname || "Professional";
  const { email, phone, website } = page.contacts;

  return (
    <>
      <Breadcrumbs items={[{ label: "Pros", href: routes.hiring.index() }, { label: name }]} />
      <div className="relative mb-16 aspect-[16/5] min-h-40 overflow-hidden bg-track">
        {page.banner && <RemoteImage src={page.banner} alt="" loading="eager" className="size-full object-cover" />}
        <Avatar src={card?.image} name={name} className="absolute -bottom-0 left-6 size-24 translate-y-1/2 border-4 border-surface text-2xl" />
      </div>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-medium text-ink-2">{name}</h1>
          <p className="text-ink-3">{[card?.profession].filter(Boolean).join(" · ")}</p>
          {card?.location && (
            <p className="mt-1 flex items-center gap-1 text-sm text-subtle">
              <MapPin className="size-4" aria-hidden /> {card.location}
            </p>
          )}
        </div>
        <WishlistButton uuid={uuid} initial={card?.isWishedList ?? false} label />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {page.description && (
            <section>
              <h2 className="mb-2 font-display text-lg font-medium text-ink-2">About</h2>
              <p className="whitespace-pre-line text-muted">{page.description}</p>
            </section>
          )}
          {page.tags.length > 0 && (
            <section>
              <h2 className="mb-2 font-display text-lg font-medium text-ink-2">Specialties</h2>
              <ul className="flex flex-wrap gap-2">
                {page.tags.map((t) => (
                  <li key={t}>
                    <Link href={routes.hiring.tag(t)} className="inline-flex h-9 items-center rounded-pill border border-line px-4 text-sm font-medium text-ink-3 hover:border-line-strong">
                      {t}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {page.projects && page.projects.length > 0 && (
            <section>
              <div className="mb-3 flex items-end justify-between">
                <h2 className="font-display text-lg font-medium text-ink-2">Projects</h2>
                <Link href={routes.hiring.professionalProjects(uuid)} className="text-sm font-medium text-brand hover:underline">
                  See all
                </Link>
              </div>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {page.projects.map((p) => (
                  <li key={p.uuid}>
                    <ProjectTile project={p} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="h-fit space-y-3 border border-line bg-surface p-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-medium text-ink-2">Contact</h2>
          {page.accessibility != null && <p className="text-sm text-muted">Available {page.accessibility} days a week</p>}
          {email && (
            <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-ink-3 hover:text-brand">
              <Mail className="size-4" aria-hidden /> {email}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone}`} className="flex items-center gap-2 text-sm text-ink-3 hover:text-brand">
              <Phone className="size-4" aria-hidden /> {phone}
            </a>
          )}
          {website && /^https?:\/\//i.test(website) && (
            <a href={website} target="_blank" rel="noopener nofollow" className="flex items-center gap-2 break-all text-sm text-ink-3 hover:text-brand">
              <Globe className="size-4 shrink-0" aria-hidden /> {website}
            </a>
          )}
          {!email && !phone && !website && <p className="text-sm text-subtle">No contact details shared.</p>}
        </aside>
      </div>
    </>
  );
}
