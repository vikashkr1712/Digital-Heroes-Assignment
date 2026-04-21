import { SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { addMonths, addYears } from "date-fns";

import { DEFAULT_PRIZE_POOL_PERCENTAGE, PLAN_PRICE_CENTS } from "../src/lib/constants";
import { toUtcDateOnly } from "../src/lib/date";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.drawWinner.deleteMany();
  await prisma.drawNumber.deleteMany();
  await prisma.draw.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.scoreEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.donation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.charity.deleteMany();

  const charities = await prisma.$transaction([
    prisma.charity.create({
      data: {
        name: "Fairway Futures Foundation",
        slug: "fairway-futures",
        description:
          "Scholarships and mentoring for underprivileged youth through sport and education.",
        upcomingEvent: "Community Golf Day • 12 June",
        featured: true,
      },
    }),
    prisma.charity.create({
      data: {
        name: "Clean Water Links",
        slug: "clean-water-links",
        description:
          "Funds safe water projects in climate-vulnerable communities.",
      },
    }),
    prisma.charity.create({
      data: {
        name: "Mindful Greens Trust",
        slug: "mindful-greens",
        description:
          "Mental wellness support for students and young athletes.",
      },
    }),
  ]);

  const adminPassword = await hash("Admin@12345", 12);
  const userPassword = await hash("Player@12345", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Platform Admin",
      email: "admin@digitalheroes.dev",
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      charityId: charities[0].id,
      charityPercentage: 10,
    },
  });

  const user = await prisma.user.create({
    data: {
      name: "Demo Subscriber",
      email: "user@digitalheroes.dev",
      passwordHash: userPassword,
      role: UserRole.SUBSCRIBER,
      charityId: charities[1].id,
      charityPercentage: 15,
    },
  });

  const extraUsers = await Promise.all(
    [
      { name: "Riley Carter", email: "riley@digitalheroes.dev", charityId: charities[0].id },
      { name: "Noah Singh", email: "noah@digitalheroes.dev", charityId: charities[2].id },
      { name: "Zoe Martinez", email: "zoe@digitalheroes.dev", charityId: charities[1].id },
      { name: "Aarav Mehta", email: "aarav@digitalheroes.dev", charityId: charities[0].id },
    ].map((profile) =>
      prisma.user.create({
        data: {
          ...profile,
          passwordHash: userPassword,
          role: UserRole.SUBSCRIBER,
          charityPercentage: 12,
        },
      }),
    ),
  );

  const allSubscribers = [user, ...extraUsers];

  for (const subscriber of allSubscribers) {
    const plan = subscriber.id === user.id ? SubscriptionPlan.YEARLY : SubscriptionPlan.MONTHLY;
    const amountCents = PLAN_PRICE_CENTS[plan];

    await prisma.subscription.create({
      data: {
        userId: subscriber.id,
        plan,
        status: SubscriptionStatus.ACTIVE,
        amountCents,
        prizePoolPercentage: DEFAULT_PRIZE_POOL_PERCENTAGE,
        gatewayProvider: "stripe",
        gatewayReference: `SEED-${subscriber.id.slice(0, 6)}`,
        renewalAt:
          plan === SubscriptionPlan.MONTHLY
            ? addMonths(new Date(), 1)
            : addYears(new Date(), 1),
      },
    });

    await prisma.payment.create({
      data: {
        subscriptionId: (await prisma.subscription.findUniqueOrThrow({ where: { userId: subscriber.id } })).id,
        amountCents,
        providerReference: `PAY-${subscriber.id.slice(0, 6)}`,
      },
    });

    const values = [38, 34, 29, 31, 36].map((base) => base - Math.floor(Math.random() * 4));

    await Promise.all(
      values.map((score, index) =>
        prisma.scoreEntry.create({
          data: {
            userId: subscriber.id,
            score,
            scoreDate: toUtcDateOnly(
              new Date(Date.now() - index * 24 * 60 * 60 * 1000),
            ),
          },
        }),
      ),
    );

    const charityAmount = Math.floor((amountCents * 12) / 100);
    await prisma.donation.create({
      data: {
        userId: subscriber.id,
        charityId: subscriber.charityId ?? charities[0].id,
        amountCents: charityAmount,
        percentage: 12,
        type: "SUBSCRIPTION",
        monthKey: `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`,
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId: admin.id,
      type: "SYSTEM",
      title: "Seed complete",
      message: "Initial admin and subscriber records are ready.",
    },
  });

  console.log("Seed completed");
  console.log("Admin login: admin@digitalheroes.dev / Admin@12345");
  console.log("User login: user@digitalheroes.dev / Player@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
