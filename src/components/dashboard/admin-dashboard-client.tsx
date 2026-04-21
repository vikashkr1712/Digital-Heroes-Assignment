"use client";

import { FormEvent, useEffect, useState } from "react";

import { money } from "@/lib/date";

type Reports = {
  totalUsers: number;
  totalSubscribers: number;
  totalPrizePoolCents: number;
  totalCharityCents: number;
  totalDraws: number;
  pendingVerifications: number;
};

type DrawSnapshot = {
  latestSimulated: {
    id: string;
    monthKey: string;
    logic: "RANDOM" | "ALGORITHMIC";
    numbers: Array<{ value: number }>;
  } | null;
  latestPublished: {
    id: string;
    monthKey: string;
    logic: "RANDOM" | "ALGORITHMIC";
    numbers: Array<{ value: number }>;
  } | null;
};

type WinnerQueueItem = {
  id: string;
  matchTier: "THREE" | "FOUR" | "FIVE";
  prizeCents: number;
  verificationStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "PENDING" | "PAID";
  proofUrl: string | null;
  reviewNote: string | null;
  user: {
    name: string;
    email: string;
  };
  draw: {
    monthKey: string;
  };
};

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: "VISITOR" | "SUBSCRIBER" | "ADMIN";
  charityPercentage: number;
  subscription: {
    status: "ACTIVE" | "CANCELED" | "LAPSED";
    plan: "MONTHLY" | "YEARLY";
  } | null;
};

type CharityItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  upcomingEvent: string | null;
  featured: boolean;
  isActive: boolean;
};

type AdminScoreItem = {
  id: string;
  score: number;
  scoreDate: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type AdminData = {
  reports: Reports;
  drawSnapshot: DrawSnapshot;
  winnerQueue: WinnerQueueItem[];
  allWinners: WinnerQueueItem[];
  users: UserItem[];
  charities: CharityItem[];
  recentScores: AdminScoreItem[];
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: {
    message: string;
  };
};

export function AdminDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<AdminData | null>(null);

  const [drawMonthKey, setDrawMonthKey] = useState("");
  const [drawLogic, setDrawLogic] = useState<"RANDOM" | "ALGORITHMIC">("RANDOM");

  const [charityName, setCharityName] = useState("");
  const [charitySlug, setCharitySlug] = useState("");
  const [charityDescription, setCharityDescription] = useState("");

  function charityPayload(
    charity: CharityItem,
    overrides?: Partial<{
      name: string;
      slug: string;
      description: string;
      imageUrl: string | undefined;
      websiteUrl: string | undefined;
      upcomingEvent: string | undefined;
      featured: boolean;
      isActive: boolean;
    }>,
  ) {
    return {
      charityId: charity.id,
      name: overrides?.name ?? charity.name,
      slug: overrides?.slug ?? charity.slug,
      description: overrides?.description ?? charity.description,
      imageUrl: overrides?.imageUrl ?? charity.imageUrl ?? undefined,
      websiteUrl: overrides?.websiteUrl ?? charity.websiteUrl ?? undefined,
      upcomingEvent: overrides?.upcomingEvent ?? charity.upcomingEvent ?? undefined,
      featured: overrides?.featured ?? charity.featured,
      isActive: overrides?.isActive ?? charity.isActive,
    };
  }

  async function loadAdminData() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/overview", { cache: "no-store" });
      const payload = (await response.json()) as ApiEnvelope<AdminData>;

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to load admin data");
        return;
      }

      setData(payload.data);
    } catch {
      setError("Network error while loading admin dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadAdminData();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  async function submitJson(path: string, method: string, body: unknown) {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.ok) {
        setError(payload.error?.message ?? "Action failed");
        return false;
      }

      await loadAdminData();
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onDrawAction(action: "simulate" | "publish") {
    await submitJson("/api/admin/draws", "POST", {
      action,
      monthKey: drawMonthKey || undefined,
      logic: drawLogic,
    });
  }

  async function onWinnerAction(
    winnerId: string,
    action: "approve" | "reject" | "markPaid",
  ) {
    await submitJson("/api/admin/winners", "PATCH", {
      winnerId,
      action,
    });
  }

  async function onPromoteUser(userId: string, role: "VISITOR" | "SUBSCRIBER" | "ADMIN") {
    await submitJson("/api/admin/users", "PATCH", {
      userId,
      role,
    });
  }

  async function onSubscriptionStatus(
    userId: string,
    status: "ACTIVE" | "CANCELED" | "LAPSED",
  ) {
    await submitJson("/api/admin/subscriptions", "PATCH", {
      userId,
      status,
    });
  }

  async function onCreateCharity(event: FormEvent) {
    event.preventDefault();

    const success = await submitJson("/api/admin/charities", "POST", {
      name: charityName,
      slug: charitySlug,
      description: charityDescription,
      featured: false,
    });

    if (success) {
      setCharityName("");
      setCharitySlug("");
      setCharityDescription("");
    }
  }

  async function onEditCharity(charity: CharityItem) {
    const name = window.prompt("Charity name", charity.name);
    if (!name) {
      return;
    }

    const slug = window.prompt("Charity slug", charity.slug);
    if (!slug) {
      return;
    }

    const description = window.prompt("Description", charity.description);
    if (!description) {
      return;
    }

    const websiteUrl = window.prompt("Website URL (optional)", charity.websiteUrl ?? "") ?? "";
    const imageUrl = window.prompt("Image URL (optional)", charity.imageUrl ?? "") ?? "";
    const upcomingEvent =
      window.prompt("Upcoming event (optional)", charity.upcomingEvent ?? "") ?? "";
    const featuredText =
      window.prompt("Featured? (yes/no)", charity.featured ? "yes" : "no") ?? "no";
    const activeText =
      window.prompt("Active? (yes/no)", charity.isActive ? "yes" : "no") ?? "yes";

    await submitJson(
      "/api/admin/charities",
      "PATCH",
      charityPayload(charity, {
        name,
        slug,
        description,
        websiteUrl: websiteUrl || undefined,
        imageUrl: imageUrl || undefined,
        upcomingEvent: upcomingEvent || undefined,
        featured: featuredText.toLowerCase().startsWith("y"),
        isActive: activeText.toLowerCase().startsWith("y"),
      }),
    );
  }

  async function onToggleCharityFeatured(charity: CharityItem) {
    await submitJson(
      "/api/admin/charities",
      "PATCH",
      charityPayload(charity, { featured: !charity.featured }),
    );
  }

  async function onToggleCharityActive(charity: CharityItem) {
    await submitJson(
      "/api/admin/charities",
      "PATCH",
      charityPayload(charity, { isActive: !charity.isActive }),
    );
  }

  async function onDeleteCharity(charityId: string) {
    const confirmed = window.confirm("Delete this charity? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    await submitJson("/api/admin/charities", "DELETE", { charityId });
  }

  async function onEditScore(score: AdminScoreItem) {
    const nextScore = window.prompt("Score (1-45)", String(score.score));
    const nextDate = window.prompt("Score date (YYYY-MM-DD)", score.scoreDate.slice(0, 10));

    if (!nextScore || !nextDate) {
      return;
    }

    await submitJson("/api/admin/scores", "PATCH", {
      scoreId: score.id,
      score: Number(nextScore),
      scoreDate: nextDate,
    });
  }

  async function onDeleteScore(scoreId: string) {
    const confirmed = window.confirm("Delete this score?");
    if (!confirmed) {
      return;
    }

    await submitJson("/api/admin/scores", "DELETE", { scoreId });
  }

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-700">Loading admin dashboard...</p>;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Could not load admin data."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-2xl bg-[#0f2a2a] p-4 text-white shadow-lg">
          <p className="text-xs uppercase tracking-wider text-white/70">Users</p>
          <h2 className="mt-1 text-lg font-semibold">{data.reports.totalUsers}</h2>
          <p className="text-xs text-white/80">Subscribers: {data.reports.totalSubscribers}</p>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wider text-slate-500">Prize Pool Distributed</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {money(data.reports.totalPrizePoolCents)}
          </h2>
          <p className="text-xs text-slate-600">Published draws: {data.reports.totalDraws}</p>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wider text-slate-500">Charity Contribution</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {money(data.reports.totalCharityCents)}
          </h2>
          <p className="text-xs text-slate-600">
            Pending verifications: {data.reports.pendingVerifications}
          </p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Draw Management</h3>
          <p className="mt-1 text-sm text-slate-600">
            Run simulation first, then publish after validating candidate outcomes.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              type="month"
              value={drawMonthKey}
              onChange={(event) => setDrawMonthKey(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2"
            />
            <select
              value={drawLogic}
              onChange={(event) => setDrawLogic(event.target.value as "RANDOM" | "ALGORITHMIC")}
              className="rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="RANDOM">Random</option>
              <option value="ALGORITHMIC">Algorithmic (frequency-weighted)</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void onDrawAction("simulate")}
              disabled={saving}
              className="rounded-xl border border-[#0f2a2a] px-4 py-2 font-semibold text-[#0f2a2a] transition hover:bg-[#eef4f4]"
            >
              Simulate Draw
            </button>
            <button
              type="button"
              onClick={() => void onDrawAction("publish")}
              disabled={saving}
              className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b]"
            >
              Publish Draw
            </button>
          </div>

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <p>
              Latest simulated: {data.drawSnapshot.latestSimulated?.monthKey ?? "none"} | Numbers: {" "}
              {data.drawSnapshot.latestSimulated?.numbers.map((item) => item.value).join(" - ") ?? "-"}
            </p>
            <p>
              Latest published: {data.drawSnapshot.latestPublished?.monthKey ?? "none"} | Numbers: {" "}
              {data.drawSnapshot.latestPublished?.numbers.map((item) => item.value).join(" - ") ?? "-"}
            </p>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Charity Management</h3>
          <form onSubmit={onCreateCharity} className="mt-4 space-y-3">
            <input
              type="text"
              required
              value={charityName}
              onChange={(event) => setCharityName(event.target.value)}
              placeholder="Charity name"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            <input
              type="text"
              required
              value={charitySlug}
              onChange={(event) => setCharitySlug(event.target.value)}
              placeholder="charity-slug"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            <textarea
              required
              value={charityDescription}
              onChange={(event) => setCharityDescription(event.target.value)}
              placeholder="Short description"
              className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b]"
            >
              Add Charity
            </button>
          </form>

          <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">
            {data.charities.map((charity) => (
              <div key={charity.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-800">{charity.name}</p>
                <p className="text-slate-600">/{charity.slug}</p>
                <p className="mt-1 text-slate-600">{charity.description}</p>
                <p className="text-xs text-slate-500">
                  {charity.featured ? "Featured" : "Standard"} • {charity.isActive ? "Active" : "Disabled"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onEditCharity(charity)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onToggleCharityFeatured(charity)}
                    className="rounded-lg border border-indigo-200 px-2 py-1 text-xs text-indigo-700"
                  >
                    {charity.featured ? "Unfeature" : "Feature"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onToggleCharityActive(charity)}
                    className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700"
                  >
                    {charity.isActive ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteCharity(charity.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Winner Verification Queue</h3>
        <div className="mt-4 space-y-3">
          {data.winnerQueue.length === 0 ? (
            <p className="text-sm text-slate-500">No pending winner reviews.</p>
          ) : (
            data.winnerQueue.map((winner) => (
              <div
                key={winner.id}
                className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700"
              >
                <p className="font-medium text-slate-900">
                  {winner.user.name} ({winner.user.email}) • {winner.draw.monthKey} • {winner.matchTier} • {money(winner.prizeCents)}
                </p>
                <p>
                  Verification: {winner.verificationStatus} | Payment: {winner.paymentStatus}
                </p>
                {winner.proofUrl ? (
                  <a
                    href={winner.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0f2a2a] underline"
                  >
                    View proof
                  </a>
                ) : (
                  <p className="text-amber-700">Proof not submitted yet.</p>
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onWinnerAction(winner.id, "approve")}
                    className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void onWinnerAction(winner.id, "reject")}
                    className="rounded-lg border border-amber-200 px-2 py-1 text-xs text-amber-700"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void onWinnerAction(winner.id, "markPaid")}
                    className="rounded-lg border border-blue-200 px-2 py-1 text-xs text-blue-700"
                  >
                    Mark Paid
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">All Winners</h3>
        <p className="mt-1 text-sm text-slate-600">
          Full history of winners across all draws, including proof and payout status.
        </p>
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
          {data.allWinners.length === 0 ? (
            <p className="text-sm text-slate-500">No winners have been generated yet.</p>
          ) : (
            data.allWinners.map((winner) => (
              <div key={winner.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">
                  {winner.user.name} ({winner.user.email}) • {winner.draw.monthKey} • {winner.matchTier} • {money(winner.prizeCents)}
                </p>
                <p className="text-slate-600">
                  Verification: {winner.verificationStatus} | Payment: {winner.paymentStatus}
                </p>
                {winner.reviewNote ? (
                  <p className="mt-1 text-xs text-slate-500">Review note: {winner.reviewNote}</p>
                ) : null}
                {winner.proofUrl ? (
                  <a
                    href={winner.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-[#0f2a2a] underline"
                  >
                    View proof
                  </a>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Score Moderation</h3>
        <p className="mt-1 text-sm text-slate-600">
          Edit or delete score entries across subscribers.
        </p>
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
          {data.recentScores.length === 0 ? (
            <p className="text-sm text-slate-500">No score records found.</p>
          ) : (
            data.recentScores.map((score) => (
              <div key={score.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                <p className="font-medium text-slate-900">
                  {score.user.name} ({score.user.email})
                </p>
                <p className="text-slate-600">
                  Score {score.score} on {new Date(score.scoreDate).toLocaleDateString()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void onEditScore(score)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDeleteScore(score.id)}
                    className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">User and Subscription Management</h3>
        <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
          {data.users.map((user) => (
            <div key={user.id} className="rounded-xl border border-slate-200 p-3 text-sm">
              <p className="font-medium text-slate-900">
                {user.name} ({user.email})
              </p>
              <p className="text-slate-600">
                Role: {user.role} | Subscription: {user.subscription?.status ?? "NONE"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onPromoteUser(user.id, "SUBSCRIBER")}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                >
                  Set Subscriber
                </button>
                <button
                  type="button"
                  onClick={() => void onPromoteUser(user.id, "ADMIN")}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs"
                >
                  Set Admin
                </button>
                <button
                  type="button"
                  onClick={() => void onSubscriptionStatus(user.id, "ACTIVE")}
                  className="rounded-lg border border-emerald-200 px-2 py-1 text-xs text-emerald-700"
                >
                  Sub Active
                </button>
                <button
                  type="button"
                  onClick={() => void onSubscriptionStatus(user.id, "CANCELED")}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-700"
                >
                  Sub Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
