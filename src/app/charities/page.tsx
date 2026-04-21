import Link from "next/link";

import { listCharities } from "@/lib/services/charity-service";

type CharitiesPageProps = {
  searchParams: Promise<{
    q?: string;
    featured?: string;
  }>;
};

export default async function CharitiesPage({ searchParams }: CharitiesPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || "";
  const featuredOnly = params.featured === "true";
  const charities = await listCharities(query || undefined, { featuredOnly });

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">Charity Directory</p>
        <h1 className="mt-2 font-serif text-4xl text-slate-900">Choose Where Your Impact Goes</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Discover partner organizations, upcoming initiatives, and spotlight campaigns supported by subscription contributions and independent donations.
        </p>
      </div>

      <form className="mb-6 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search by name or mission"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
          />
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="featured"
              value="true"
              defaultChecked={featuredOnly}
              className="h-4 w-4"
            />
            Featured only
          </label>
          <button
            type="submit"
            className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b]"
          >
            Apply Filters
          </button>
        </div>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {charities.map((charity) => (
          <article
            key={charity.id}
            className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl"
          >
            <p className="text-xs uppercase tracking-wider text-slate-500">
              {charity.featured ? "Featured" : "Partner"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">{charity.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{charity.description}</p>
            {charity.upcomingEvent ? (
              <p className="mt-3 text-xs font-medium text-[#0f2a2a]">Upcoming: {charity.upcomingEvent}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href={`/charities/${charity.slug}`} className="text-sm font-semibold text-[#0f2a2a] underline">
                View full profile
              </Link>
              {charity.websiteUrl ? (
                <a
                  href={charity.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-[#0f2a2a] underline"
                >
                  Visit website
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      {charities.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No charities matched your filters. Try adjusting the search term.
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl bg-[#0f2a2a] p-6 text-white">
        <h3 className="text-2xl font-semibold">Ready to join the draw and support a cause?</h3>
        <p className="mt-2 text-white/80">
          Sign up, choose your charity at onboarding, and start entering your latest scores.
        </p>
        <Link
          href="/signup"
          className="mt-4 inline-block rounded-xl bg-[#d9b160] px-4 py-2 font-semibold text-[#102727] transition hover:bg-[#e2c178]"
        >
          Create account
        </Link>
      </div>
    </main>
  );
}
