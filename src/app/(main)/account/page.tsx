import { Bookmark, FileText, Folder, Heart, HelpCircle, Info, Lock, MessageSquare, Receipt, ShieldCheck, Smartphone, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { AccountHeader } from "@/features/account/components/account-header";
import { AccountRow, AccountSection } from "@/features/account/components/account-sections";
import { PlanCard } from "@/features/account/components/plan-card";
import { ShareRow } from "@/features/account/components/share-row";
import { getAccountSummary } from "@/features/account/server/repository";

import { loadPage } from "@/server/page-data";
import { getSessionTokens } from "@/server/session/cookies";
import { routes } from "@/shared/config/routes";
import { AccountButtonRowSignOut } from "./sign-out-row";

export const metadata: Metadata = { title: "Account" };

/** Mirrors AccountScreen (uritect_account_main_menu): header, Plan & Billing, then the app's row groups. */
export default async function AccountPage() {
  const [summary, { user }] = await Promise.all([loadPage(routes.account.index(), () => getAccountSummary()), getSessionTokens()]);
  const wp = routes.wordpress;
  const store = summary.appVersion;
  return (
    <>
      <AccountHeader username={user?.username ?? ""} email={user?.email ?? ""} imageUri={user?.imageUri ?? ""} />
      <PlanCard summary={summary} />
      <AccountSection title="Your content">
        <AccountRow href={routes.account.projects()} label="My Projects" icon={Folder} />
        <AccountRow href={routes.account.favoriteIdeas()} label="Favorite Ideas" icon={Bookmark} />
        <AccountRow href={routes.hiring.wishlist()} label="Favorite Professionals" icon={Heart} />
        <AccountRow href={routes.account.transactions()} label="Transactions" icon={Receipt} />
      </AccountSection>
      <AccountSection title="Settings">
        <AccountRow href={routes.account.edit()} label="Edit profile" icon={Info} />
        <AccountRow href={routes.account.changePassword()} label="Change password" icon={Lock} />
        <AccountRow href={routes.account.privacy()} label="Privacy & Data" hint="Privacy controls, account deletion" icon={ShieldCheck} />
      </AccountSection>
      <AccountSection title="Help">
        <AccountRow href={routes.account.support()} label="Contact Support" icon={MessageSquare} />
        <AccountRow href={wp.faq} label="FAQ" icon={HelpCircle} external />
        <AccountRow href={wp.userGuide} label="User Guide" icon={BookOpen} external />
        <AccountRow href={wp.feedback} label="Send Feedback" icon={MessageSquare} external />
        <AccountRow href={wp.about} label="About Archibi" icon={Info} external />
      </AccountSection>
      <AccountSection title="More">
        <ShareRow text={summary.shareText} />
        <AccountRow href={wp.privacy} label="Privacy Policy" icon={FileText} external />
        <AccountRow href={wp.terms} label="Terms of Service" icon={FileText} external />
        {(store?.appStoreUrl || store?.googlePlayUrl) && (
          <AccountRow href={store.appStoreUrl ?? store.googlePlayUrl ?? wp.home} label="Get the Archibi app" hint={store.latestIos ? `Latest version ${store.latestIos}` : undefined} icon={Smartphone} external />
        )}
      </AccountSection>
      <AccountButtonRowSignOut trigger={<SignOutRowTrigger />} />
    </>
  );
}

function SignOutRowTrigger() {
  return (
    <button type="button" className="h-[46px] w-full rounded-sm border border-danger text-[13px] font-bold uppercase tracking-[.02em] text-danger transition-colors hover:bg-danger hover:text-white md:w-auto md:px-8">
      Log out
    </button>
  );
}
