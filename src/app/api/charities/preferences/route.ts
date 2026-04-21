import type { NextRequest } from "next/server";
import { z } from "zod";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { updateUserCharityPreferences } from "@/lib/services/charity-service";

const updatePreferencesSchema = z.object({
  charityId: z.string().cuid(),
  charityPercentage: z.coerce.number().int().min(10).max(100),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const input = await readValidatedJson(request, updatePreferencesSchema);
    const result = await updateUserCharityPreferences(
      user.id,
      input.charityId,
      input.charityPercentage,
    );

    return ok({ preferences: result });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
