import { Pencil } from "lucide-react";
import Link from "next/link";
import { routes } from "@/shared/config/routes";
import { Avatar } from "@/shared/ui/avatar";
import { buttonVariants } from "@/shared/ui/button";

export function AccountHeader({ username, email, imageUri }: { username: string; email: string; imageUri: string }) {
  return (
    <header className="mb-8 flex items-center gap-4">
      <Avatar src={imageUri || null} name={username || email} className="size-16 text-lg" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-[26px] font-medium text-ink-2">{username || email}</h1>
        <p className="truncate text-sm text-subtle">{email}</p>
      </div>
      <Link href={routes.account.edit()} className={buttonVariants({ variant: "secondary", size: "sm" })}>
        <Pencil className="size-3.5" aria-hidden /> Edit
      </Link>
    </header>
  );
}
