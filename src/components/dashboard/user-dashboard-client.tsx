"use client";

import { FormEvent, useEffect, useState } from "react";

import { money } from "@/lib/date";

type ScoreItem = {
  id: string;
  score: number;
  scoreDate: string;
};

type CharityItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  featured: boolean;
};

type WinnerItem = {
  id: string;
  prizeCents: number;
  matchTier: "THREE" | "FOUR" | "FIVE";
  verificationStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "PENDING" | "PAID";
  proofUrl: string | null;
  draw: {
    monthKey: string;
  };
};

type DrawSummary = {
  drawsEntered: number;
  upcomingDrawMonth: string;
  totalWonCents: number;
  winners: WinnerItem[];
};

type UserPayload = {
  id: string;
  name: string;
  email: string;
  charityId: string | null;
  charityPercentage: number;
  subscription: {
    status: "ACTIVE" | "CANCELED" | "LAPSED";
    plan: "MONTHLY" | "YEARLY";
    renewalAt: string;
  } | null;
};

type DrawItem = {
  id: string;
  monthKey: string;
  numbers: Array<{ value: number }>;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  createdAt: string;
};

type DashboardData = {
  user: UserPayload;
  scores: ScoreItem[];
  charities: CharityItem[];
  drawSummary: DrawSummary;
  draws: DrawItem[];
  notifications: NotificationItem[];
};

type ApiEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: {
    message: string;
  };
};

type SubscriptionCheckoutPayload = {
  checkoutUrl: string;
  sessionId: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function UserDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);

  const [newScoreValue, setNewScoreValue] = useState("");
  const [newScoreDate, setNewScoreDate] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

  const [selectedCharity, setSelectedCharity] = useState("");
  const [charityPercentage, setCharityPercentage] = useState(10);

  const [donationCharityId, setDonationCharityId] = useState("");
  const [donationAmount, setDonationAmount] = useState(500);

  const [proofWinnerId, setProofWinnerId] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const payload = (await response.json()) as ApiEnvelope<DashboardData>;

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to load dashboard");
        return;
      }

      setData(payload.data);
      setSelectedCharity(payload.data.user.charityId ?? payload.data.charities[0]?.id ?? "");
      setCharityPercentage(payload.data.user.charityPercentage ?? 10);
      setDonationCharityId(payload.data.user.charityId ?? payload.data.charities[0]?.id ?? "");

      const proofCandidate = payload.data.drawSummary.winners.find(
        (winner) =>
          winner.verificationStatus === "NOT_SUBMITTED" || winner.verificationStatus === "REJECTED",
      );
      setProofWinnerId(proofCandidate?.id ?? "");
    } catch {
      setError("Network error while loading dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const activeSubscription = data?.user.subscription?.status === "ACTIVE";

  async function submitJson(path: string, method: string, body?: unknown) {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const payload = (await response.json()) as ApiEnvelope<unknown>;
      if (!response.ok || !payload.ok) {
        setError(payload.error?.message ?? "Action failed");
        return false;
      }

      await loadDashboard();
      return true;
    } catch {
      setError("Network error");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function onSubscribe(event: FormEvent) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const payload = (await response.json()) as ApiEnvelope<SubscriptionCheckoutPayload>;

      if (!response.ok || !payload.ok || !payload.data?.checkoutUrl) {
        setError(payload.error?.message ?? "Unable to create Stripe checkout session");
        return;
      }

      window.location.assign(payload.data.checkoutUrl);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function onAddScore(event: FormEvent) {
    event.preventDefault();

    await submitJson("/api/scores", "POST", {
      score: Number(newScoreValue),
      scoreDate: newScoreDate,
    });

    setNewScoreValue("");
    setNewScoreDate("");
  }

  async function onUpdateScore(score: ScoreItem) {
    const newScore = window.prompt("New score (1-45)", String(score.score));
    const newDate = window.prompt("New date (YYYY-MM-DD)", score.scoreDate.slice(0, 10));

    if (!newScore || !newDate) {
      return;
    }

    await submitJson("/api/scores", "PATCH", {
      scoreId: score.id,
      score: Number(newScore),
      scoreDate: newDate,
    });
  }

  async function onDeleteScore(scoreId: string) {
    await submitJson("/api/scores", "DELETE", { scoreId });
  }

  async function onSaveCharityPreferences(event: FormEvent) {
    event.preventDefault();

    await submitJson("/api/charities/preferences", "POST", {
      charityId: selectedCharity,
      charityPercentage,
    });
  }

  async function onDonate(event: FormEvent) {
    event.preventDefault();

    await submitJson("/api/donations", "POST", {
      charityId: donationCharityId,
      amountCents: donationAmount,
    });
  }

  async function onProofSubmit(event: FormEvent) {
    event.preventDefault();

    if (!proofWinnerId) {
      setError("No winner record selected for proof upload");
      return;
    }

    await submitJson("/api/winners/proof", "POST", {
      winnerId: proofWinnerId,
      proofUrl,
    });

    setProofUrl("");
  }

  if (loading) {
    return <p className="rounded-2xl bg-white p-6 text-slate-700">Loading your dashboard...</p>;
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error || "Could not load dashboard data."}
      </div>
    );
  }

  const chartableRecentDraws = data.draws.slice(0, 3);
  const missingScoresForEligibility = Math.max(0, 5 - data.scores.length);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl bg-[#0f2a2a] p-4 text-white shadow-lg">
          <p className="text-xs uppercase tracking-wider text-white/70">Subscription</p>
          <h2 className="mt-1 text-lg font-semibold">
            {data.user.subscription ? data.user.subscription.status : "Not active"}
          </h2>
          <p className="mt-1 text-xs text-white/80">
            {data.user.subscription
              ? `${data.user.subscription.plan} plan, renews ${formatDate(
                  data.user.subscription.renewalAt,
                )}`
              : "Activate monthly or yearly plan to unlock full features"}
          </p>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wider text-slate-500">Total won</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {money(data.drawSummary.totalWonCents)}
          </h2>
          <p className="mt-1 text-xs text-slate-600">Current payout status shown below.</p>
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wider text-slate-500">Draws entered</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{data.drawSummary.drawsEntered}</h2>
          <p className="mt-1 text-xs text-slate-600">Next target month: {data.drawSummary.upcomingDrawMonth}</p>
          {missingScoresForEligibility > 0 ? (
            <p className="mt-1 text-xs text-amber-700">
              Add {missingScoresForEligibility} more score{missingScoresForEligibility === 1 ? "" : "s"} to be draw-eligible.
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-200">
          <p className="text-xs uppercase tracking-wider text-slate-500">Chosen charity share</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{data.user.charityPercentage}%</h2>
          <p className="mt-1 text-xs text-slate-600">Adjust any time from preferences.</p>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Subscription and Access</h3>
          <p className="mt-1 text-sm text-slate-600">
            Non-subscribers have restricted access. Activate to join draws and manage scores.
          </p>

          <form onSubmit={onSubscribe} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedPlan}
              onChange={(event) =>
                setSelectedPlan(event.target.value as "MONTHLY" | "YEARLY")
              }
              className="rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="MONTHLY">Monthly Plan</option>
              <option value="YEARLY">Yearly Plan (discounted)</option>
            </select>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b] disabled:opacity-60"
            >
              Continue to Stripe Checkout
            </button>
          </form>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Score Management</h3>
          <p className="mt-1 text-sm text-slate-600">
            Enter latest 5 Stableford scores only. Duplicate dates are blocked automatically.
          </p>
          {missingScoresForEligibility > 0 ? (
            <p className="mt-2 text-xs text-amber-700">
              You are currently not eligible for the draw. Add {missingScoresForEligibility} more score{missingScoresForEligibility === 1 ? "" : "s"}.
            </p>
          ) : (
            <p className="mt-2 text-xs text-emerald-700">You are eligible for the next draw.</p>
          )}

          <form onSubmit={onAddScore} className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              type="number"
              min={1}
              max={45}
              required
              value={newScoreValue}
              onChange={(event) => setNewScoreValue(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Score"
              disabled={!activeSubscription}
            />
            <input
              type="date"
              required
              value={newScoreDate}
              onChange={(event) => setNewScoreDate(event.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2"
              disabled={!activeSubscription}
            />
            <button
              type="submit"
              disabled={saving || !activeSubscription}
              className="rounded-xl bg-[#d9b160] px-4 py-2 font-semibold text-[#102727] transition hover:bg-[#e2c178] disabled:opacity-60"
            >
              Save Score
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {data.scores.length === 0 ? (
              <p className="text-sm text-slate-500">No scores yet.</p>
            ) : (
              data.scores.map((score) => (
                <div
                  key={score.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
                >
                  <p className="text-sm text-slate-800">
                    <span className="font-semibold">{score.score}</span> points on {formatDate(score.scoreDate)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void onUpdateScore(score)}
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
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Charity Preferences</h3>
          <form onSubmit={onSaveCharityPreferences} className="mt-4 space-y-3">
            <select
              value={selectedCharity}
              onChange={(event) => setSelectedCharity(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              {data.charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={10}
              max={100}
              value={charityPercentage}
              onChange={(event) => setCharityPercentage(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b] disabled:opacity-60"
            >
              Save Preferences
            </button>
          </form>

          <form onSubmit={onDonate} className="mt-6 space-y-3 border-t border-slate-200 pt-4">
            <p className="text-sm font-medium text-slate-700">Independent Donation</p>
            <select
              value={donationCharityId}
              onChange={(event) => setDonationCharityId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              {data.charities.map((charity) => (
                <option key={charity.id} value={charity.id}>
                  {charity.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={100}
              step={100}
              value={donationAmount}
              onChange={(event) => setDonationAmount(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-[#0f2a2a] px-4 py-2 font-semibold text-[#0f2a2a] transition hover:bg-[#eef4f4] disabled:opacity-60"
            >
              Donate Now
            </button>
          </form>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Winner Verification</h3>
          <p className="mt-1 text-sm text-slate-600">
            Winners only: upload a screenshot proof from your golf platform.
          </p>

          <form onSubmit={onProofSubmit} className="mt-4 space-y-3">
            <select
              value={proofWinnerId}
              onChange={(event) => setProofWinnerId(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            >
              <option value="">Select winner entry</option>
              {data.drawSummary.winners.map((winner) => (
                <option key={winner.id} value={winner.id}>
                  {winner.draw.monthKey} - {winner.matchTier} - {money(winner.prizeCents)}
                </option>
              ))}
            </select>

            <input
              type="url"
              required
              value={proofUrl}
              onChange={(event) => setProofUrl(event.target.value)}
              placeholder="https://...proof-image"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#0f2a2a] px-4 py-2 font-semibold text-white transition hover:bg-[#1a3b3b] disabled:opacity-60"
            >
              Submit Proof
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {data.drawSummary.winners.length === 0 ? (
              <p className="text-sm text-slate-500">No winner entries yet.</p>
            ) : (
              data.drawSummary.winners.map((winner) => (
                <div key={winner.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-800">
                    {winner.draw.monthKey} • {winner.matchTier} match • {money(winner.prizeCents)}
                  </p>
                  <p className="text-slate-600">
                    Verification: {winner.verificationStatus} | Payment: {winner.paymentStatus}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Recent Published Draws</h3>
          <div className="mt-3 space-y-2">
            {chartableRecentDraws.length === 0 ? (
              <p className="text-sm text-slate-500">No published draws yet.</p>
            ) : (
              chartableRecentDraws.map((draw) => (
                <div key={draw.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm font-medium text-slate-800">{draw.monthKey}</p>
                  <p className="text-sm text-slate-600">
                    Numbers: {draw.numbers.map((item) => item.value).join(" - ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-lg ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">System Notifications</h3>
          <div className="mt-3 space-y-2">
            {data.notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications yet.</p>
            ) : (
              data.notifications.map((notification) => (
                <div key={notification.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-800">{notification.title}</p>
                  <p className="text-slate-600">{notification.message}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(notification.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
