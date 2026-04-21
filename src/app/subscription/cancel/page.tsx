import Link from "next/link";

export default function SubscriptionCancelPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">Checkout Canceled</p>
        <h1 className="mt-2 font-serif text-4xl text-slate-900">No charge was completed</h1>
        <p className="mt-3 text-slate-600">
          Your checkout was canceled before payment completion. You can restart the subscription
          flow whenever you are ready.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b]"
          >
            Try Again from Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
