import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import { submitWinnerProof } from "@/lib/services/draw-service";
import { winnerProofSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const input = await readValidatedJson(request, winnerProofSchema);
    await submitWinnerProof(user.id, input.winnerId, input.proofUrl);
    return ok({ message: "Proof uploaded" });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
