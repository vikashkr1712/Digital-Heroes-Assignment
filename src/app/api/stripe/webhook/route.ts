import { NextRequest } from "next/server";
import Stripe from "stripe";

import { activateSubscriptionFromCheckoutSession } from "@/lib/services/subscription-service";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!signature || !webhookSecret) {
    return new Response("Missing Stripe webhook configuration", { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature";
    return new Response(message, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await activateSubscriptionFromCheckoutSession(session);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    return new Response(message, { status: 400 });
  }

  return new Response("ok", { status: 200 });
}
