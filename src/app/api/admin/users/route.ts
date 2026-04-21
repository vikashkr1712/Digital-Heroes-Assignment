import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { adminUserUpdateSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  const users = await prisma.user.findMany({
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
  });

  return ok({ users });
}

export async function PATCH(request: NextRequest) {
  const admin = await getCurrentUserFromRequest(request);
  if (!admin || admin.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminUserUpdateSchema);

    await prisma.user.update({
      where: { id: input.userId },
      data: {
        name: input.name,
        role: input.role,
        charityPercentage: input.charityPercentage,
      },
    });

    return ok({ message: "User profile updated" });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
