"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.push("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-full border border-white/30 px-4 py-1.5 text-sm font-medium text-white transition hover:border-white hover:bg-white/10"
      disabled={loading}
    >
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}
