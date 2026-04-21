import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import {
  createStripeCheckoutSession,
  hasActiveSubscription,
} from "@/lib/services/subscription-service";
import { subscriptionSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const active = await hasActiveSubscription(user.id);

  return ok({
    subscription: user.subscription,
    active,
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  try {
    const input = await readValidatedJson(request, subscriptionSchema);
    const checkout = await createStripeCheckoutSession(user.id, input.plan, request.nextUrl.origin);

    return ok(
      {
        message: "Checkout session created",
        checkoutUrl: checkout.checkoutUrl,
        sessionId: checkout.sessionId,
      },
      201,
    );
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
