import { UserDashboardClient } from "@/components/dashboard/user-dashboard-client";

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">User Panel</p>
        <h1 className="mt-2 font-serif text-4xl text-slate-900">Your Contribution Dashboard</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Manage subscription status, maintain your latest 5 scores, track draw participation, and upload winner proof for payout.
        </p>
      </div>

      <UserDashboardClient />
    </main>
  );
}
