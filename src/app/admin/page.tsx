import { AdminDashboardClient } from "@/components/dashboard/admin-dashboard-client";

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">Admin Panel</p>
        <h1 className="mt-2 font-serif text-4xl text-slate-900">Operations and Control Center</h1>
        <p className="mt-2 max-w-4xl text-slate-600">
          Control users and subscriptions, run draw simulations, publish official results, manage charities, verify winners, and mark payouts completed.
        </p>
      </div>

      <AdminDashboardClient />
    </main>
  );
}
