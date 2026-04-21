import { ok, fail } from "@/lib/api-response";
import { listCharities } from "@/lib/services/charity-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const featuredOnly = url.searchParams.get("featured") === "true";
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;

  try {
    const charities = await listCharities(query, {
      featuredOnly,
      limit: Number.isNaN(limit) ? undefined : limit,
    });
    return ok({ charities });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch charities";
    return fail(message, 400);
  }
}
