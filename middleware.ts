import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { verifySessionToken } from "@/lib/session-token";

function isSecureRequest(request: NextRequest): boolean {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (!forwardedProto) {
    return request.nextUrl.protocol === "https:";
  }

  return forwardedProto === "https";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "production" && !isSecureRequest(request)) {
    const secureUrl = new URL(request.url);
    secureUrl.protocol = "https:";
    return NextResponse.redirect(secureUrl);
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isProtectedArea = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (isProtectedArea && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  if (isAuthPage && session) {
    const destination = session.role === "ADMIN" ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/signup"],
};
