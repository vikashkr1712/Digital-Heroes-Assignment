import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">Welcome back</p>
        <h1 className="mt-2 font-serif text-3xl text-slate-900">Access your impact dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Track scores, subscribe to monthly draws, and support meaningful charities.
        </p>

        <div className="mt-6">
          <LoginForm />
        </div>

        <p className="mt-5 text-sm text-slate-600">
          New here?{" "}
          <Link href="/signup" className="font-semibold text-[#0f2a2a] underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
