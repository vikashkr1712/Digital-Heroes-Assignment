import { hashPassword } from "@/lib/auth";
import { ok, fail } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { createSessionToken, setAuthCookie } from "@/lib/session-token";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await readValidatedJson(request, signupSchema);

    const existing = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: { id: true },
    });

    if (existing) {
      return fail("Email already in use", 409);
    }

    if (input.charityId) {
      const charity = await prisma.charity.findFirst({
        where: { id: input.charityId, isActive: true },
        select: { id: true },
      });

      if (!charity) {
        return fail("Selected charity is not available", 400);
      }
    }

    const passwordHash = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
        role: "SUBSCRIBER",
        charityId: input.charityId,
        charityPercentage: input.charityPercentage,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = ok({ user }, 201);
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
