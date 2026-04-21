import { compare, hash } from "bcryptjs";
import type { Prisma } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  getTokenFromRequest,
  type SessionTokenPayload,
  verifySessionToken,
} from "@/lib/session-token";

const sessionUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  charityPercentage: true,
  charityId: true,
  createdAt: true,
  subscription: {
    select: {
      id: true,
      plan: true,
      status: true,
      amountCents: true,
      renewalAt: true,
      startedAt: true,
      canceledAt: true,
    },
  },
  charity: {
    select: {
      id: true,
      name: true,
      slug: true,
      featured: true,
    },
  },
} satisfies Prisma.UserSelect;

export type SessionUser = Prisma.UserGetPayload<{ select: typeof sessionUserSelect }>;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return compare(password, passwordHash);
}

export async function getSessionFromRequest(
  request: NextRequest,
): Promise<SessionTokenPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getSessionFromCookies(): Promise<SessionTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSessionFromCookies();
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: sessionUserSelect,
  });

  return user;
}

export async function getCurrentUserFromRequest(
  request: NextRequest,
): Promise<SessionUser | null> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: sessionUserSelect,
  });

  return user;
}

export async function isAdminRequest(request: NextRequest): Promise<boolean> {
  const session = await getSessionFromRequest(request);
  return Boolean(session && session.role === UserRole.ADMIN);
}

export function assertRole(user: SessionUser, role: UserRole): void {
  if (user.role !== role) {
    throw new Error("Forbidden");
  }
}
