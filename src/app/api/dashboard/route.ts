import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listCharities } from "@/lib/services/charity-service";
import {
  getPublishedDrawHistory,
  getUserDrawSummary,
} from "@/lib/services/draw-service";
import { listScoresForUser } from "@/lib/services/score-service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const [scores, charities, drawSummary, draws, notifications] = await Promise.all([
    listScoresForUser(user.id),
    listCharities(),
    getUserDrawSummary(user.id),
    getPublishedDrawHistory(6),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return ok({
    user,
    scores,
    charities,
    drawSummary,
    draws,
    notifications,
  });
}
