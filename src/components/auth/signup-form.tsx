"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type CharityOption = {
  id: string;
  name: string;
};

type SignupFormProps = {
  charities: CharityOption[];
};

type SignupResponse = {
  ok: boolean;
  error?: {
    message: string;
  };
};

export function SignupForm({ charities }: SignupFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [charityId, setCharityId] = useState(charities[0]?.id ?? "");
  const [charityPercentage, setCharityPercentage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const hasCharities = charities.length > 0;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          charityId: hasCharities ? charityId || undefined : undefined,
          charityPercentage,
        }),
      });

      const payload = (await response.json()) as SignupResponse;

      if (!response.ok || !payload.ok) {
        setError(payload.error?.message ?? "Unable to create account");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Name</span>
        <input
          type="text"
          required
          minLength={2}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-[#0f2a2a]"
          placeholder="Your full name"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-[#0f2a2a]"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-[#0f2a2a]"
          placeholder="Minimum 8 characters"
        />
      </label>

      {hasCharities ? (
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Preferred charity</span>
          <select
            value={charityId}
            onChange={(event) => setCharityId(event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-[#0f2a2a]"
          >
            {charities.map((charity) => (
              <option key={charity.id} value={charity.id}>
                {charity.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Charity contribution percentage (minimum 10%)
        </span>
        <input
          type="number"
          min={10}
          max={100}
          value={charityPercentage}
          onChange={(event) => setCharityPercentage(Number(event.target.value))}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none transition focus:border-[#0f2a2a]"
        />
      </label>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#0f2a2a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1a3b3b] disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
