"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type LoginResponse = {
  ok: boolean;
  data?: {
    user: {
      role: "VISITOR" | "SUBSCRIBER" | "ADMIN";
    };
  };
  error?: {
    message: string;
  };
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as LoginResponse;

      if (!response.ok || !payload.ok || !payload.data) {
        setError(payload.error?.message ?? "Unable to login");
        return;
      }

      const destination = payload.data.user.role === "ADMIN" ? "/admin" : "/dashboard";
      router.push(destination);
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
        <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-0 transition focus:border-[#0f2a2a]"
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
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-0 transition focus:border-[#0f2a2a]"
          placeholder="Minimum 8 characters"
        />
      </label>

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#0f2a2a] px-4 py-2.5 font-semibold text-white transition hover:bg-[#1a3b3b] disabled:opacity-60"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
