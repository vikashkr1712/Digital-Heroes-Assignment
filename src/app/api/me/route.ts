import type { NextRequest } from "next/server";

import { ok, fail } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);

  if (!user) {
    return fail("Unauthorized", 401);
  }

  return ok({ user });
}
