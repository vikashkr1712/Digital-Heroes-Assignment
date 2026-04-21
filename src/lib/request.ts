import { ZodError, type ZodType } from "zod";

export async function readValidatedJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export function errorMessage(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues.map((issue) => issue.message).join("; ");
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
