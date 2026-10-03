import type { Metadata } from "next";
import { StaffSignInForm } from "@/modules/auth/components/StaffSignInForm";
import { signInContent } from "@/modules/auth/content/signInContent";
import { SiteHeader } from "@/shared/components/organisms/SiteHeader/SiteHeader";
import { routes } from "@/shared/routes";

export const metadata: Metadata = {
  title: signInContent.metadataTitle,
};

// A1. proxy.ts sends anyone already signed in straight on to returnTo.
export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { returnTo } = await searchParams;
  return (
    <>
      <SiteHeader variant="admin" homeHref={routes.admin.home} />
      <main className="flex flex-1 justify-center px-8 py-12">
        <div className="w-full max-w-140">
          <StaffSignInForm returnTo={typeof returnTo === "string" ? returnTo : null} />
        </div>
      </main>
    </>
  );
}
