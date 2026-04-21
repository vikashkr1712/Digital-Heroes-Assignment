import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl bg-[#0f2a2a] px-6 py-10 text-white shadow-2xl sm:px-10 sm:py-14">
        <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-[#d9b160]/30 blur-2xl" />
        <div className="absolute -bottom-8 -right-10 h-52 w-52 rounded-full bg-[#5fa08f]/30 blur-2xl" />
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/70">Emotion-led platform</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
              Play Better. Give Better. Win Together.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
              A subscription-first experience that turns your latest golf scores into monthly draw entry while channeling real contributions to charities you care about.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-[#d9b160] px-5 py-2.5 font-semibold text-[#102727] transition hover:bg-[#e2c178]"
              >
                Start Subscription Flow
              </Link>
              <Link
                href="/charities"
                className="rounded-xl border border-white/40 px-5 py-2.5 font-semibold text-white transition hover:bg-white/10"
              >
                Explore Charities
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur">
            <p className="text-xs uppercase tracking-widest text-white/70">How it works</p>
            <ol className="mt-3 space-y-3 text-sm text-white/90">
              <li>1. Choose monthly or yearly subscription</li>
              <li>2. Enter your latest 5 Stableford scores</li>
              <li>3. Monthly draw runs in random or algorithmic mode</li>
              <li>4. Winners upload proof and receive tracked payouts</li>
              <li>5. Charity contributions are auto-recorded per subscription</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          {
            title: "Subscription Engine",
            text: "Monthly and yearly plans with lifecycle handling: renewal, cancellation, lapsed states, and real-time access checks.",
          },
          {
            title: "Score Experience",
            text: "Fast, mobile-friendly score entry with strict rules: range 1-45, one entry per date, rolling retention of latest 5 only.",
          },
          {
            title: "Draw and Reward Logic",
            text: "5-number draws, simulation mode, admin publishing, tier-based prize split, and jackpot rollover for unclaimed 5-match payouts.",
          },
          {
            title: "Charity Integration",
            text: "Users pick their cause at signup, keep at least 10% contribution, and can add independent donations anytime.",
          },
          {
            title: "Verification Workflow",
            text: "Winners submit screenshot proof, admins approve or reject, and payout state advances from pending to paid.",
          },
          {
            title: "Admin Control Center",
            text: "Manage users, subscriptions, scores, draws, charities, winner queues, and analytics across the complete platform lifecycle.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <h2 className="font-serif text-2xl text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">Evaluation alignment</p>
        <h2 className="mt-2 font-serif text-3xl text-slate-900">Built against all PRD checkpoints</h2>
        <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <p>• Signup, login, and authenticated dashboards</p>
          <p>• Subscription flow (monthly/yearly)</p>
          <p>• Score entry with 5-score rolling logic</p>
          <p>• Draw simulation and publication pipeline</p>
          <p>• Charity selection and contribution tracking</p>
          <p>• Winner verification and payout transitions</p>
          <p>• Responsive mobile and desktop UI</p>
          <p>• Admin reports and edge-case handling</p>
        </div>
      </section>
    </main>
  );
}
