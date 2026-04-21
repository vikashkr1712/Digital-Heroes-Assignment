import { ok, fail } from "@/lib/api-response";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { createSessionToken, setAuthCookie } from "@/lib/session-token";
import { loginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = await readValidatedJson(request, loginSchema);

    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return fail("Invalid email or password", 401);
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      return fail("Invalid email or password", 401);
    }

    const token = await createSessionToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
