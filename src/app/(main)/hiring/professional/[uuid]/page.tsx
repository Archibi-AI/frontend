import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isUuid, ProjectTile, WishlistButton } from "@/features/hiring";
import { Breadcrumbs } from "@/features/hiring/components/breadcrumbs";
import { recallProfessional } from "@/features/hiring/server/card-cache";
import { getProfessionalPage, getProfessionalsProject } from "@/features/hiring/server/repository";
import { AppError } from "@/shared/errors/app-error";
import { routes } from "@/shared/config/routes";
import { Avatar } from "@/shared/ui/avatar";
import { buttonVariants } from "@/shared/ui/button";
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
  const [page, card, described] = await Promise.all([
    getProfessionalPage(uuid).catch((e) => {
      if (e instanceof AppError && (e.code === "NOT_FOUND" || e.status === 404)) notFound();
      throw e;
    }),
    recallProfessional(uuid),
    // the pro page lists projects without descriptions; the dialog needs them (the app has them from the projects list)
    getProfessionalsProject(1, uuid).then((r) => r.projects).catch(() => []),
  ]);
  const descriptions = new Map(described.map((p) => [p.uuid, p.description ?? ""]));
  const name = card?.fullname || "Professional";
  const { email, phone, website } = page.contacts;

  return (
    <>
      <Breadcrumbs items={[{ label: "Pros", href: routes.hiring.index() }, { label: name }]} />
      <section aria-label="Profile" className="mb-8 overflow-hidden rounded-md border border-line bg-surface shadow-sm">
        <div className="aspect-[2/1] max-h-80 w-full bg-gradient-to-br from-brand-strong via-brand to-brand-bright sm:aspect-[3/1] lg:aspect-[16/5]">
          {page.banner && <RemoteImage src={page.banner} alt={`${name} banner`} loading="eager" className="size-full object-cover object-center" />}
        </div>
        <div className="relative px-5 pb-6 sm:px-8">
          <Avatar src={card?.image} name={name} className="-mt-14 size-28 !rounded-full border-4 border-surface bg-surface text-3xl shadow-sm sm:-mt-20 sm:size-40 sm:text-5xl" />
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-display text-[28px] font-medium leading-tight text-ink-2 sm:text-[32px]">{name}</h1>
              {card?.profession && <p className="mt-1 text-lg text-ink-3">{card.profession}</p>}
              {card?.location && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-subtle">
                  <MapPin className="size-4" aria-hidden /> {card.location}
                </p>
              )}
            </div>
            {page.tags.length > 0 && <p className="max-w-xs text-sm text-muted">{page.tags.slice(0, 3).join(" · ")}</p>}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <WishlistButton uuid={uuid} initial={card?.isWishedList ?? false} label />
            <a href="#contact" className={buttonVariants({ size: "sm" })}>Contact</a>
            {page.projects && page.projects.length > 0 && (
              <Link href={routes.hiring.professionalProjects(uuid)} className={buttonVariants({ variant: "secondary", size: "sm" })}>See projects</Link>
            )}
          </div>
        </div>
      </section>

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
                    <ProjectTile project={{ ...p, description: descriptions.get(p.uuid) }} professionalName={name} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside id="contact" className="h-fit scroll-mt-24 space-y-3 border border-line bg-surface p-5 lg:sticky lg:top-24">
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
