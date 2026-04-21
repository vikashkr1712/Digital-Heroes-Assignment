import { ok } from "@/lib/api-response";
import { getPublishedDrawHistory } from "@/lib/services/draw-service";

export async function GET() {
  const draws = await getPublishedDrawHistory(12);
  return ok({ draws });
}
