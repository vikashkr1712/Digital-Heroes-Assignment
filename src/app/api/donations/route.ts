import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { createIndependentDonation } from "@/lib/services/charity-service";
import { donationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const input = await readValidatedJson(request, donationSchema);
    const donation = await createIndependentDonation(
      user.id,
      input.charityId,
      input.amountCents,
    );

    return ok({ donation }, 201);
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
