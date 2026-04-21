import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";
import { prisma } from "@/lib/prisma";

export default async function SignupPage() {
  const charities = await prisma.charity.findMany({
    where: { isActive: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 sm:px-6">
      <div className="rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-[#0f2a2a]">Join the platform</p>
        <h1 className="mt-2 font-serif text-3xl text-slate-900">Create your account</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose your charity, set your contribution, and start your monthly score-to-reward journey.
        </p>

        <div className="mt-6">
          <SignupForm charities={charities} />
        </div>

        <p className="mt-5 text-sm text-slate-600">
          Already registered?{" "}
          <Link href="/login" className="font-semibold text-[#0f2a2a] underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
