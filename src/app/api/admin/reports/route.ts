import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import {
  getAdminDrawSnapshot,
  getAdminReports,
  getWinnerReviewQueue,
} from "@/lib/services/draw-service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  const [reports, drawSnapshot, winnerQueue] = await Promise.all([
    getAdminReports(),
    getAdminDrawSnapshot(),
    getWinnerReviewQueue(),
  ]);

  return ok({ reports, drawSnapshot, winnerQueue });
}
