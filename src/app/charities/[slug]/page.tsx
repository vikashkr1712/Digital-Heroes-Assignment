import Link from "next/link";
import { notFound } from "next/navigation";

import { getCharityBySlugPublic } from "@/lib/services/charity-service";

type CharityProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CharityProfilePage({ params }: CharityProfilePageProps) {
  const { slug } = await params;
  const charity = await getCharityBySlugPublic(slug);

  if (!charity) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      <article className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">
          {charity.featured ? "Featured Charity" : "Charity Partner"}
        </p>
        <h1 className="mt-2 font-serif text-4xl text-slate-900">{charity.name}</h1>
        <p className="mt-4 text-base leading-7 text-slate-700">{charity.description}</p>

        {charity.upcomingEvent ? (
          <div className="mt-6 rounded-2xl bg-[#eef4f4] p-4 text-sm text-[#133737]">
            <p className="font-semibold">Upcoming Event</p>
            <p className="mt-1">{charity.upcomingEvent}</p>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          {charity.websiteUrl ? (
            <a
              href={charity.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b]"
            >
              Visit Official Website
            </a>
          ) : null}
          <Link
            href="/signup"
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Sign Up and Support This Charity
          </Link>
          <Link href="/charities" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100">
            Back to Directory
          </Link>
        </div>
      </article>
    </main>
  );
}
