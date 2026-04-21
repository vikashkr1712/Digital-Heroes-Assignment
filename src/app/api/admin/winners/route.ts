import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import {
  getAllWinners,
  getWinnerReviewQueue,
  updateWinnerReview,
} from "@/lib/services/draw-service";
import { adminWinnerReviewSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  const [winnerQueue, winners] = await Promise.all([
    getWinnerReviewQueue(),
    getAllWinners(),
  ]);

  return ok({ winnerQueue, winners });
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminWinnerReviewSchema);
    await updateWinnerReview(user.id, input.winnerId, input.action, input.reviewNote);

    return ok({ message: "Winner status updated" });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
