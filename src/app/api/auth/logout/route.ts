import { ok } from "@/lib/api-response";
import { clearAuthCookie } from "@/lib/session-token";

export async function POST() {
  const response = ok({ message: "Logged out" });
  clearAuthCookie(response);
  return response;
}
