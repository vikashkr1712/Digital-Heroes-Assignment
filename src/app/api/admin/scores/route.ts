import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { toUtcDateOnly } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { adminScoreDeleteSchema, adminScoreUpdateSchema } from "@/lib/validation";

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminScoreUpdateSchema);

    await prisma.scoreEntry.update({
      where: { id: input.scoreId },
      data: {
        score: input.score,
        scoreDate: toUtcDateOnly(input.scoreDate),
      },
    });

    return ok({ message: "Score updated" });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminScoreDeleteSchema);

    await prisma.scoreEntry.delete({
      where: { id: input.scoreId },
    });

    return ok({ message: "Score deleted" });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
