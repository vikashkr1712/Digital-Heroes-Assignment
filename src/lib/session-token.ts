import type { UserRole } from "@prisma/client";
import type { NextRequest, NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

import {
  AUTH_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE_SECONDS,
  SESSION_DURATION,
} from "@/lib/constants";

const JWT_ALGORITHM = "HS256";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "unsafe-local-secret-change-in-production",
);

export type SessionTokenPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
};

export async function createSessionToken(payload: SessionTokenPayload): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(secret);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [JWT_ALGORITHM] });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    path: "/",
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });
}

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
}
