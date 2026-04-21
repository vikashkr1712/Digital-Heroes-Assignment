import type { NextRequest } from "next/server";

import { fail, ok } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { errorMessage, readValidatedJson } from "@/lib/request";
import {
  createCharity,
  deleteCharity,
  listCharitiesForAdmin,
  updateCharity,
} from "@/lib/services/charity-service";
import {
  adminCharityCreateSchema,
  adminCharityDeleteSchema,
  adminCharityUpdateSchema,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  const charities = await listCharitiesForAdmin();
  return ok({ charities });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminCharityCreateSchema);
    const charity = await createCharity(input);
    return ok({ charity }, 201);
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminCharityUpdateSchema);
    const charity = await updateCharity(input);
    return ok({ charity });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUserFromRequest(request);
  if (!user || user.role !== "ADMIN") {
    return fail("Forbidden", 403);
  }

  try {
    const input = await readValidatedJson(request, adminCharityDeleteSchema);
    await deleteCharity(input.charityId);
    return ok({ message: "Charity deleted" });
  } catch (error) {
    return fail(errorMessage(error), 400);
  }
}
