import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listCharitiesForAdmin } from "@/lib/services/charity-service";
import {
  getAllWinners,
  getAdminDrawSnapshot,
  getAdminReports,
  getWinnerReviewQueue,
} from "@/lib/services/draw-service";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  const [reports, drawSnapshot, winnerQueue, allWinners, users, charities, recentScores] = await Promise.all([
    getAdminReports(),
    getAdminDrawSnapshot(),
    getWinnerReviewQueue(),
    getAllWinners(),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        charityPercentage: true,
        createdAt: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            renewalAt: true,
          },
        },
      },
      take: 200,
    }),
    listCharitiesForAdmin(),
    prisma.scoreEntry.findMany({
      orderBy: [{ scoreDate: "desc" }, { createdAt: "desc" }],
      take: 300,
      select: {
        id: true,
        score: true,
        scoreDate: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return ok({
    reports,
    drawSnapshot,
    winnerQueue,
    allWinners,
    users,
    charities,
    recentScores,
  });
}
