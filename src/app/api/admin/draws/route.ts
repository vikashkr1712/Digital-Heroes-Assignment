import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import {
  publishMonthlyDraw,
  simulateMonthlyDraw,
} from "@/lib/services/draw-service";
import { drawActionSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);

  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, drawActionSchema);

    if (input.action === "simulate") {
      const simulation = await simulateMonthlyDraw(user.id, {
        monthKey: input.monthKey,
        logic: input.logic,
      });

      return ok({ simulation });
    }

    const publication = await publishMonthlyDraw(user.id, {
      monthKey: input.monthKey,
      logic: input.logic,
    });

    return ok({ publication });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
