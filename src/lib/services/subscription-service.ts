import { NotificationType, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import { addMonths, addYears, isAfter } from "date-fns";
import type Stripe from "stripe";

import {
  DEFAULT_PRIZE_POOL_PERCENTAGE,
  MIN_CHARITY_PERCENTAGE,
  PLAN_PRICE_CENTS,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { notifyUser } from "@/lib/services/notification-service";
import { getStripeClient } from "@/lib/stripe";

type ActivationOptions = {
  gatewayProvider?: string;
  gatewayReference?: string;
  paymentReference?: string;
  amountCents?: number;
};

type CheckoutSessionResult = {
  checkoutUrl: string;
  sessionId: string;
};

function getRenewalDate(plan: SubscriptionPlan, fromDate = new Date()): Date {
  if (plan === SubscriptionPlan.MONTHLY) {
    return addMonths(fromDate, 1);
  }

  return addYears(fromDate, 1);
}

export function planPrice(plan: SubscriptionPlan): number {
  return PLAN_PRICE_CENTS[plan];
}

function getAppBaseUrl(fallbackOrigin?: string): string {
  const base = process.env.APP_BASE_URL?.trim() || fallbackOrigin?.trim();

  if (!base) {
    throw new Error("APP_BASE_URL is not configured.");
  }

  return base.replace(/\/$/, "");
}

function parseSubscriptionPlan(value: string | null | undefined): SubscriptionPlan {
  if (value === SubscriptionPlan.MONTHLY || value === SubscriptionPlan.YEARLY) {
    return value;
  }

  throw new Error("Invalid subscription plan in checkout metadata.");
}

export async function refreshSubscriptionStatus(userId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      renewalAt: true,
    },
  });

  if (!subscription) {
    return;
  }

  if (
    subscription.status === SubscriptionStatus.ACTIVE &&
    isAfter(new Date(), subscription.renewalAt)
  ) {
    await prisma.subscription.update({
      where: { userId },
      data: { status: SubscriptionStatus.LAPSED },
    });
  }
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  await refreshSubscriptionStatus(userId);

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      status: true,
      renewalAt: true,
    },
  });

  return Boolean(
    subscription &&
      subscription.status === SubscriptionStatus.ACTIVE &&
      subscription.renewalAt >= new Date(),
  );
}

export async function activateSubscription(
  userId: string,
  plan: SubscriptionPlan,
  options?: ActivationOptions,
): Promise<void> {
  const amountCents = options?.amountCents ?? planPrice(plan);
  const gatewayProvider = options?.gatewayProvider ?? "stripe";
  const gatewayReference = options?.gatewayReference ?? `MAN-${crypto.randomUUID().slice(0, 12)}`;
  const paymentReference = options?.paymentReference ?? gatewayReference;

  const existingPayment = await prisma.payment.findFirst({
    where: {
      providerReference: paymentReference,
    },
    select: {
      id: true,
    },
  });

  if (existingPayment) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      charityId: true,
      charityPercentage: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();
  const renewalAt = getRenewalDate(plan, now);

  await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        amountCents,
        prizePoolPercentage: DEFAULT_PRIZE_POOL_PERCENTAGE,
        gatewayProvider,
        gatewayReference,
        renewalAt,
      },
      update: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        amountCents,
        gatewayProvider,
        gatewayReference,
        canceledAt: null,
        renewalAt,
      },
    });

    await tx.payment.create({
      data: {
        subscriptionId: subscription.id,
        amountCents,
        providerReference: paymentReference,
      },
    });

    if (user.charityId) {
      const percent = Math.max(user.charityPercentage, MIN_CHARITY_PERCENTAGE);
      const donationAmount = Math.floor((amountCents * percent) / 100);

      await tx.donation.create({
        data: {
          userId,
          charityId: user.charityId,
          amountCents: donationAmount,
          percentage: percent,
          type: "SUBSCRIPTION",
          monthKey: `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`,
        },
      });
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        role: "SUBSCRIBER",
      },
    });
  });

  await notifyUser(
    userId,
    NotificationType.SYSTEM,
    "Subscription activated",
    `Your ${plan.toLowerCase()} plan is active until ${renewalAt.toDateString()}.`,
  );
}

export async function createStripeCheckoutSession(
  userId: string,
  plan: SubscriptionPlan,
  fallbackOrigin?: string,
): Promise<CheckoutSessionResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const stripe = getStripeClient();
  const baseUrl = getAppBaseUrl(fallbackOrigin);
  const priceIdByPlan: Record<SubscriptionPlan, string | undefined> = {
    MONTHLY: process.env.STRIPE_PRICE_MONTHLY_ID,
    YEARLY: process.env.STRIPE_PRICE_YEARLY_ID,
  };
  const metadata = {
    userId,
    plan,
  };
  const recurringInterval: "month" | "year" =
    plan === SubscriptionPlan.MONTHLY ? "month" : "year";

  const lineItems = priceIdByPlan[plan]
    ? [
        {
          price: priceIdByPlan[plan],
          quantity: 1,
        },
      ]
    : [
        {
          price_data: {
            currency: "inr",
            product_data: {
              name:
                plan === SubscriptionPlan.MONTHLY
                  ? "Digital Heroes Monthly Subscription"
                  : "Digital Heroes Yearly Subscription",
            },
            unit_amount: planPrice(plan),
            recurring: {
              interval: recurringInterval,
            },
          },
          quantity: 1,
        },
      ];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/subscription/cancel`,
    metadata,
    subscription_data: {
      metadata,
    },
    line_items: lineItems,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return {
    checkoutUrl: session.url,
    sessionId: session.id,
  };
}

export async function activateSubscriptionFromCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.metadata?.userId || session.client_reference_id;
  const plan = parseSubscriptionPlan(session.metadata?.plan);

  if (!userId) {
    throw new Error("Missing user ID metadata in checkout session.");
  }

  await activateSubscription(userId, plan, {
    gatewayProvider: "stripe",
    gatewayReference: session.id,
    paymentReference: session.payment_intent?.toString() || session.id,
    amountCents: session.amount_total ?? planPrice(plan),
  });
}
