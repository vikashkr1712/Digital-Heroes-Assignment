import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import {
  createScoreForUser,
  deleteScoreForUser,
  listScoresForUser,
  updateScoreForUser,
} from "@/lib/services/score-service";
import { hasActiveSubscription } from "@/lib/services/subscription-service";
import {
  scoreCreateSchema,
  scoreDeleteSchema,
  scoreUpdateSchema,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const scores = await listScoresForUser(user.id);
  return ok({ scores });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const active = await hasActiveSubscription(user.id);
  if (!active) {
    return fail("Active subscription required", 403);
  }

  try {
    const input = await readValidatedJson(request, scoreCreateSchema);
    const scores = await createScoreForUser(user.id, input.score, input.scoreDate);
    return ok({ scores }, 201);
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const active = await hasActiveSubscription(user.id);
  if (!active) {
    return fail("Active subscription required", 403);
  }

  try {
    const input = await readValidatedJson(request, scoreUpdateSchema);
    const scores = await updateScoreForUser(user.id, input.scoreId, input.score, input.scoreDate);
    return ok({ scores });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user) {
    return fail("Unauthorized", 401);
  }

  const active = await hasActiveSubscription(user.id);
  if (!active) {
    return fail("Active subscription required", 403);
  }

  try {
    const input = await readValidatedJson(request, scoreDeleteSchema);
    const scores = await deleteScoreForUser(user.id, input.scoreId);
    return ok({ scores });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
