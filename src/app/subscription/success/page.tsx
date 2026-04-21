import Link from "next/link";

export default function SubscriptionSuccessPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">Payment Success</p>
        <h1 className="mt-2 font-serif text-4xl text-slate-900">Subscription confirmed</h1>
        <p className="mt-3 text-slate-600">
          Your Stripe checkout is complete. We are finalizing your access in the background using
          webhook confirmation.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          If your dashboard still shows inactive status, wait a few seconds and refresh.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b]"
          >
            Go to Dashboard
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
