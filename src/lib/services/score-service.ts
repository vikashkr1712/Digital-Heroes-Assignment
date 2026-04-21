import { MAX_STORED_SCORES, SCORE_MAX, SCORE_MIN } from "@/lib/constants";
import { toUtcDateOnly } from "@/lib/date";
import { prisma } from "@/lib/prisma";

export async function listScoresForUser(userId: string) {
  return prisma.scoreEntry.findMany({
    where: { userId },
    orderBy: [{ scoreDate: "desc" }, { createdAt: "desc" }],
  });
}

export async function createScoreForUser(userId: string, score: number, scoreDateText: string) {
  if (score < SCORE_MIN || score > SCORE_MAX) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  const scoreDate = toUtcDateOnly(scoreDateText);

  const existing = await prisma.scoreEntry.findUnique({
    where: {
      userId_scoreDate: {
        userId,
        scoreDate,
      },
    },
  });

  if (existing) {
    throw new Error("A score already exists for this date.");
  }

  await prisma.scoreEntry.create({
    data: {
      userId,
      score,
      scoreDate,
    },
  });

  const ascending = await prisma.scoreEntry.findMany({
    where: { userId },
    orderBy: [{ scoreDate: "asc" }, { createdAt: "asc" }],
  });

  if (ascending.length > MAX_STORED_SCORES) {
    const deleteCount = ascending.length - MAX_STORED_SCORES;
    const toDelete = ascending.slice(0, deleteCount).map((entry) => entry.id);

    await prisma.scoreEntry.deleteMany({
      where: {
        id: {
          in: toDelete,
        },
      },
    });
  }

  return listScoresForUser(userId);
}

export async function updateScoreForUser(
  userId: string,
  scoreId: string,
  score: number,
  scoreDateText: string,
) {
  if (score < SCORE_MIN || score > SCORE_MAX) {
    throw new Error(`Score must be between ${SCORE_MIN} and ${SCORE_MAX}`);
  }

  const scoreDate = toUtcDateOnly(scoreDateText);

  const existing = await prisma.scoreEntry.findFirst({
    where: {
      userId,
      scoreDate,
      id: { not: scoreId },
    },
    select: { id: true },
  });

  if (existing) {
    throw new Error("Another score already exists for this date.");
  }

  await prisma.scoreEntry.update({
    where: {
      id: scoreId,
      userId,
    },
    data: {
      score,
      scoreDate,
    },
  });

  return listScoresForUser(userId);
}

export async function deleteScoreForUser(userId: string, scoreId: string) {
  await prisma.scoreEntry.delete({
    where: {
      id: scoreId,
      userId,
    },
  });

  return listScoresForUser(userId);
}
