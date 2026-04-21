import {
  DrawLogic,
  DrawStatus,
  MatchTier,
  NotificationType,
  SubscriptionStatus,
  WinnerPaymentStatus,
  WinnerVerificationStatus,
} from "@prisma/client";

import {
  DRAW_PICK_COUNT,
  MATCH_TIER_SHARE,
  MAX_STORED_SCORES,
  SCORE_MAX,
  SCORE_MIN,
} from "@/lib/constants";
import { toMonthKey } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { notifyManyUsers } from "@/lib/services/notification-service";

export type DrawParticipant = {
  userId: string;
  scoreValues: number[];
};

type DrawCandidate = {
  userId: string;
  matchedCount: number;
  matchTier: MatchTier;
};

type PreparedDrawInput = {
  monthKey: string;
  logic: DrawLogic;
  participants: DrawParticipant[];
  activeUserIds: string[];
  eligibleUserIds: string[];
  basePoolCents: number;
  rolloverCents: number;
  numbers: number[];
  candidateByTier: Record<MatchTier, DrawCandidate[]>;
};

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function pickRandomDrawNumbers(): number[] {
  const selected = new Set<number>();

  while (selected.size < DRAW_PICK_COUNT) {
    selected.add(randomBetween(SCORE_MIN, SCORE_MAX));
  }

  return [...selected];
}

export function pickAlgorithmicDrawNumbers(participants: DrawParticipant[]): number[] {
  const frequency = new Map<number, number>();

  for (let value = SCORE_MIN; value <= SCORE_MAX; value += 1) {
    frequency.set(value, 0);
  }

  for (const participant of participants) {
    for (const score of participant.scoreValues) {
      frequency.set(score, (frequency.get(score) ?? 0) + 1);
    }
  }

  const ranked = [...frequency.entries()].sort((a, b) => b[1] - a[1]);
  const lowRanked = [...frequency.entries()].sort((a, b) => a[1] - b[1]);

  const chosen: number[] = [];
  let highIndex = 0;
  let lowIndex = 0;

  while (chosen.length < DRAW_PICK_COUNT && (highIndex < ranked.length || lowIndex < lowRanked.length)) {
    if (highIndex < ranked.length) {
      const value = ranked[highIndex][0];
      if (!chosen.includes(value)) {
        chosen.push(value);
      }
      highIndex += 1;
    }

    if (chosen.length >= DRAW_PICK_COUNT) {
      break;
    }

    if (lowIndex < lowRanked.length) {
      const value = lowRanked[lowIndex][0];
      if (!chosen.includes(value)) {
        chosen.push(value);
      }
      lowIndex += 1;
    }
  }

  while (chosen.length < DRAW_PICK_COUNT) {
    const randomValue = randomBetween(SCORE_MIN, SCORE_MAX);
    if (!chosen.includes(randomValue)) {
      chosen.push(randomValue);
    }
  }

  return chosen;
}

export function calculatePoolBreakdown(basePoolCents: number, rolloverCents: number) {
  const tier5Base = Math.floor((basePoolCents * MATCH_TIER_SHARE.FIVE) / 100);
  const tier4Cents = Math.floor((basePoolCents * MATCH_TIER_SHARE.FOUR) / 100);
  const tier3Cents = basePoolCents - tier5Base - tier4Cents;
  const tier5Cents = tier5Base + rolloverCents;

  return {
    poolTotalCents: basePoolCents + rolloverCents,
    tier5Cents,
    tier4Cents,
    tier3Cents,
  };
}

export function mapMatchedCountToTier(matchedCount: number): MatchTier | null {
  if (matchedCount >= 5) {
    return MatchTier.FIVE;
  }

  if (matchedCount === 4) {
    return MatchTier.FOUR;
  }

  if (matchedCount === 3) {
    return MatchTier.THREE;
  }

  return null;
}

export function hasMinimumScoresForDraw(scoreCount: number): boolean {
  return scoreCount >= MAX_STORED_SCORES;
}

export function evaluateCandidates(
  participants: DrawParticipant[],
  drawNumbers: number[],
): Record<MatchTier, DrawCandidate[]> {
  const drawSet = new Set(drawNumbers);
  const result: Record<MatchTier, DrawCandidate[]> = {
    FIVE: [],
    FOUR: [],
    THREE: [],
  };

  for (const participant of participants) {
    const matchedCount = participant.scoreValues.filter((value) => drawSet.has(value)).length;
    const tier = mapMatchedCountToTier(matchedCount);

    if (!tier) {
      continue;
    }

    result[tier].push({
      userId: participant.userId,
      matchedCount,
      matchTier: tier,
    });
  }

  return result;
}

async function getRolloverFromPreviousDraw(): Promise<number> {
  const previousPublished = await prisma.draw.findFirst({
    where: { status: DrawStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    include: {
      winners: {
        where: { matchTier: MatchTier.FIVE },
        select: { id: true },
      },
    },
  });

  if (!previousPublished) {
    return 0;
  }

  const hasFiveMatchWinner = previousPublished.winners.length > 0;
  if (hasFiveMatchWinner) {
    return 0;
  }

  return previousPublished.tier5Cents;
}

async function getParticipantState(): Promise<{
  participants: DrawParticipant[];
  activeUserIds: string[];
  eligibleUserIds: string[];
  basePoolCents: number;
}> {
  const users = await prisma.user.findMany({
    where: {
      subscription: {
        status: SubscriptionStatus.ACTIVE,
        renewalAt: { gte: new Date() },
      },
    },
    select: {
      id: true,
      subscription: {
        select: {
          amountCents: true,
          prizePoolPercentage: true,
        },
      },
      scores: {
        orderBy: [{ scoreDate: "desc" }, { createdAt: "desc" }],
        take: MAX_STORED_SCORES,
      },
    },
  });

  const eligibleUsers = users.filter((user) => hasMinimumScoresForDraw(user.scores.length));

  const participants: DrawParticipant[] = eligibleUsers.map((user) => ({
    userId: user.id,
    scoreValues: user.scores.map((score) => score.score),
  }));

  const basePoolCents = users.reduce((total, user) => {
    if (!user.subscription) {
      return total;
    }

    return (
      total +
      Math.floor(
        (user.subscription.amountCents * user.subscription.prizePoolPercentage) / 100,
      )
    );
  }, 0);

  return {
    participants,
    activeUserIds: users.map((user) => user.id),
    eligibleUserIds: eligibleUsers.map((user) => user.id),
    basePoolCents,
  };
}

async function buildDrawInput(monthKey: string, logic: DrawLogic): Promise<PreparedDrawInput> {
  const state = await getParticipantState();
  const rolloverCents = await getRolloverFromPreviousDraw();
  const numbers =
    logic === DrawLogic.ALGORITHMIC
      ? pickAlgorithmicDrawNumbers(state.participants)
      : pickRandomDrawNumbers();

  return {
    monthKey,
    logic,
    participants: state.participants,
    activeUserIds: state.activeUserIds,
    eligibleUserIds: state.eligibleUserIds,
    basePoolCents: state.basePoolCents,
    rolloverCents,
    numbers,
    candidateByTier: evaluateCandidates(state.participants, numbers),
  };
}

export async function simulateMonthlyDraw(
  executedById: string,
  input: { monthKey?: string; logic?: DrawLogic },
) {
  const monthKey = input.monthKey ?? toMonthKey();
  const logic = input.logic ?? DrawLogic.RANDOM;

  const publishedForMonth = await prisma.draw.findFirst({
    where: {
      monthKey,
      status: DrawStatus.PUBLISHED,
    },
    select: { id: true },
  });

  if (publishedForMonth) {
    throw new Error("A published draw already exists for this month.");
  }

  const drawInput = await buildDrawInput(monthKey, logic);
  const pool = calculatePoolBreakdown(drawInput.basePoolCents, drawInput.rolloverCents);

  const metrics = {
    activeSubscribers: drawInput.activeUserIds.length,
    eligibleParticipants: drawInput.eligibleUserIds.length,
    ineligibleSubscribers: drawInput.activeUserIds.length - drawInput.eligibleUserIds.length,
    candidateCount: {
      fiveMatch: drawInput.candidateByTier.FIVE.length,
      fourMatch: drawInput.candidateByTier.FOUR.length,
      threeMatch: drawInput.candidateByTier.THREE.length,
    },
    generatedAt: new Date().toISOString(),
  };

  const existing = await prisma.draw.findFirst({
    where: {
      monthKey,
      status: DrawStatus.SIMULATED,
    },
    select: { id: true },
  });

  let drawId = existing?.id;

  if (existing) {
    await prisma.$transaction(async (tx) => {
      await tx.drawNumber.deleteMany({ where: { drawId: existing.id } });
      await tx.drawWinner.deleteMany({ where: { drawId: existing.id } });

      await tx.draw.update({
        where: { id: existing.id },
        data: {
          logic,
          poolTotalCents: pool.poolTotalCents,
          tier5Cents: pool.tier5Cents,
          tier4Cents: pool.tier4Cents,
          tier3Cents: pool.tier3Cents,
          rolloverFromPreviousCents: drawInput.rolloverCents,
          participantCount: drawInput.participants.length,
          simulatedAt: new Date(),
          metricsJson: JSON.stringify(metrics),
          executedById,
        },
      });

      await tx.drawNumber.createMany({
        data: drawInput.numbers.map((value, index) => ({
          drawId: existing.id,
          position: index + 1,
          value,
        })),
      });
    });
  } else {
    const created = await prisma.draw.create({
      data: {
        monthKey,
        logic,
        status: DrawStatus.SIMULATED,
        poolTotalCents: pool.poolTotalCents,
        tier5Cents: pool.tier5Cents,
        tier4Cents: pool.tier4Cents,
        tier3Cents: pool.tier3Cents,
        rolloverFromPreviousCents: drawInput.rolloverCents,
        participantCount: drawInput.participants.length,
        metricsJson: JSON.stringify(metrics),
        executedById,
        numbers: {
          create: drawInput.numbers.map((value, index) => ({
            position: index + 1,
            value,
          })),
        },
      },
    });

    drawId = created.id;
  }

  return {
    drawId,
    monthKey,
    logic,
    numbers: drawInput.numbers,
    pool,
    preview: metrics.candidateCount,
  };
}

function allocateTierPayout(
  tier: MatchTier,
  candidates: DrawCandidate[],
  tierAmount: number,
): Array<{
  userId: string;
  matchTier: MatchTier;
  matchedCount: number;
  prizeCents: number;
  verificationStatus: WinnerVerificationStatus;
  paymentStatus: WinnerPaymentStatus;
}> {
  if (candidates.length === 0) {
    return [];
  }

  const prizePerWinner = Math.floor(tierAmount / candidates.length);

  return candidates.map((candidate) => ({
    userId: candidate.userId,
    matchTier: tier,
    matchedCount: candidate.matchedCount,
    prizeCents: prizePerWinner,
    verificationStatus: WinnerVerificationStatus.NOT_SUBMITTED,
    paymentStatus: WinnerPaymentStatus.PENDING,
  }));
}

export async function publishMonthlyDraw(
  executedById: string,
  input: { monthKey?: string; logic?: DrawLogic },
) {
  const monthKey = input.monthKey ?? toMonthKey();
  const logic = input.logic ?? DrawLogic.RANDOM;

  const existingPublished = await prisma.draw.findFirst({
    where: { monthKey, status: DrawStatus.PUBLISHED },
    select: { id: true },
  });

  if (existingPublished) {
    throw new Error("This month already has a published draw.");
  }

  let simulated = await prisma.draw.findFirst({
    where: { monthKey, status: DrawStatus.SIMULATED },
    include: { numbers: true },
  });

  if (!simulated) {
    await simulateMonthlyDraw(executedById, { monthKey, logic });
    simulated = await prisma.draw.findFirst({
      where: { monthKey, status: DrawStatus.SIMULATED },
      include: { numbers: true },
    });
  }

  if (!simulated) {
    throw new Error("Could not create simulation before publish.");
  }

  const drawNumbers = simulated.numbers
    .sort((a, b) => a.position - b.position)
    .map((number) => number.value);

  const participantsState = await getParticipantState();
  const candidateByTier = evaluateCandidates(participantsState.participants, drawNumbers);

  const winnersPayload = [
    ...allocateTierPayout(MatchTier.FIVE, candidateByTier.FIVE, simulated.tier5Cents),
    ...allocateTierPayout(MatchTier.FOUR, candidateByTier.FOUR, simulated.tier4Cents),
    ...allocateTierPayout(MatchTier.THREE, candidateByTier.THREE, simulated.tier3Cents),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.draw.update({
      where: { id: simulated.id },
      data: {
        status: DrawStatus.PUBLISHED,
        logic,
        publishedAt: new Date(),
        participantCount: participantsState.participants.length,
      },
    });

    await tx.drawWinner.deleteMany({ where: { drawId: simulated.id } });

    if (winnersPayload.length > 0) {
      await tx.drawWinner.createMany({
        data: winnersPayload.map((winner) => ({
          drawId: simulated.id,
          ...winner,
        })),
      });
    }
  });

  const winnerUserIds = [...new Set(winnersPayload.map((winner) => winner.userId))];

  await notifyManyUsers(
    participantsState.activeUserIds,
    NotificationType.DRAW_RESULT,
    `Draw results for ${monthKey}`,
    `The monthly draw has been published with numbers: ${drawNumbers.join(", ")}.`,
  );

  await notifyManyUsers(
    winnerUserIds,
    NotificationType.WINNER_ALERT,
    `You are a winner for ${monthKey}`,
    "Upload your score screenshot to begin verification and payout.",
  );

  return {
    drawId: simulated.id,
    monthKey,
    numbers: drawNumbers,
    winners: {
      fiveMatch: candidateByTier.FIVE.length,
      fourMatch: candidateByTier.FOUR.length,
      threeMatch: candidateByTier.THREE.length,
      total: winnersPayload.length,
    },
  };
}

export async function getPublishedDrawHistory(limit = 12) {
  return prisma.draw.findMany({
    where: { status: DrawStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    take: limit,
    include: {
      numbers: {
        orderBy: { position: "asc" },
      },
      winners: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}

export async function getAdminDrawSnapshot() {
  const latestSimulated = await prisma.draw.findFirst({
    where: { status: DrawStatus.SIMULATED },
    orderBy: { simulatedAt: "desc" },
    include: { numbers: { orderBy: { position: "asc" } } },
  });

  const latestPublished = await prisma.draw.findFirst({
    where: { status: DrawStatus.PUBLISHED },
    orderBy: { publishedAt: "desc" },
    include: { numbers: { orderBy: { position: "asc" } } },
  });

  return {
    latestSimulated,
    latestPublished,
  };
}

export async function getWinnerReviewQueue() {
  return prisma.drawWinner.findMany({
    where: {
      verificationStatus: {
        in: [WinnerVerificationStatus.PENDING, WinnerVerificationStatus.APPROVED],
      },
      paymentStatus: WinnerPaymentStatus.PENDING,
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      draw: {
        select: {
          id: true,
          monthKey: true,
        },
      },
    },
  });
}

export async function getAllWinners(limit = 300) {
  return prisma.drawWinner.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      draw: {
        select: {
          id: true,
          monthKey: true,
          status: true,
        },
      },
    },
  });
}

export async function updateWinnerReview(
  adminId: string,
  winnerId: string,
  action: "approve" | "reject" | "markPaid",
  reviewNote?: string,
) {
  const winner = await prisma.drawWinner.findUnique({
    where: { id: winnerId },
    select: {
      id: true,
      userId: true,
      verificationStatus: true,
      paymentStatus: true,
    },
  });

  if (!winner) {
    throw new Error("Winner entry not found.");
  }

  if (action === "markPaid") {
    if (winner.verificationStatus !== WinnerVerificationStatus.APPROVED) {
      throw new Error("Winner must be approved before payout can be marked paid.");
    }

    await prisma.drawWinner.update({
      where: { id: winnerId },
      data: {
        paymentStatus: WinnerPaymentStatus.PAID,
        paidAt: new Date(),
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNote,
      },
    });

    await notifyManyUsers(
      [winner.userId],
      NotificationType.WINNER_ALERT,
      "Payout completed",
      "Your winner payout has been marked as paid.",
    );

    return;
  }

  const verificationStatus =
    action === "approve"
      ? WinnerVerificationStatus.APPROVED
      : WinnerVerificationStatus.REJECTED;

  await prisma.drawWinner.update({
    where: { id: winnerId },
    data: {
      verificationStatus,
      reviewedById: adminId,
      reviewedAt: new Date(),
      reviewNote,
    },
  });

  await notifyManyUsers(
    [winner.userId],
    NotificationType.WINNER_ALERT,
    action === "approve" ? "Proof approved" : "Proof rejected",
    action === "approve"
      ? "Your proof is approved. Payout will be processed shortly."
      : "Your proof was rejected. Please upload a clearer screenshot.",
  );
}

export async function submitWinnerProof(
  userId: string,
  winnerId: string,
  proofUrl: string,
): Promise<void> {
  const winner = await prisma.drawWinner.findUnique({
    where: { id: winnerId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!winner || winner.userId !== userId) {
    throw new Error("Winner record not found for this user.");
  }

  await prisma.drawWinner.update({
    where: { id: winnerId },
    data: {
      proofUrl,
      verificationStatus: WinnerVerificationStatus.PENDING,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });

  await notifyManyUsers(
    admins.map((admin) => admin.id),
    NotificationType.SYSTEM,
    "Winner proof submitted",
    "A winner has submitted proof and is waiting for review.",
  );
}

export async function getUserDrawSummary(userId: string) {
  const [winners, draws] = await Promise.all([
    prisma.drawWinner.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        draw: {
          select: {
            monthKey: true,
          },
        },
      },
    }),
    prisma.draw.findMany({
      where: { status: DrawStatus.PUBLISHED },
      orderBy: { publishedAt: "desc" },
      take: 24,
    }),
  ]);

  const totalWonCents = winners.reduce((sum, winner) => sum + winner.prizeCents, 0);

  return {
    drawsEntered: draws.length,
    upcomingDrawMonth: toMonthKey(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    winners,
    totalWonCents,
  };
}

export async function getAdminReports() {
  const [
    totalUsers,
    totalSubscribers,
    totalPrizePool,
    charityTotals,
    totalDraws,
    pendingVerifications,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    prisma.draw.aggregate({
      where: { status: DrawStatus.PUBLISHED },
      _sum: { poolTotalCents: true },
    }),
    prisma.donation.aggregate({
      _sum: { amountCents: true },
    }),
    prisma.draw.count({ where: { status: DrawStatus.PUBLISHED } }),
    prisma.drawWinner.count({
      where: {
        verificationStatus: WinnerVerificationStatus.PENDING,
      },
    }),
  ]);

  return {
    totalUsers,
    totalSubscribers,
    totalPrizePoolCents: totalPrizePool._sum.poolTotalCents ?? 0,
    totalCharityCents: charityTotals._sum.amountCents ?? 0,
    totalDraws,
    pendingVerifications,
  };
}
