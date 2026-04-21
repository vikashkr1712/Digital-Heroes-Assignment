import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { adminSubscriptionUpdateSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminSubscriptionUpdateSchema);

    await prisma.subscription.update({
      where: { userId: input.userId },
      data: {
        status: input.status,
        canceledAt: input.status === "CANCELED" ? new Date() : null,
      },
    });

    return ok({ message: "Subscription updated" });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
