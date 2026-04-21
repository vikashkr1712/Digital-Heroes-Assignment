import { format } from "date-fns";

export function toUtcDateOnly(input: string | Date): Date {
  const date = input instanceof Date ? input : new Date(input);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date");
  }

  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function toMonthKey(date = new Date()): string {
  return format(date, "yyyy-MM");
}

export function fromMonthKey(monthKey: string): Date {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month key");
  }

  return new Date(Date.UTC(year, month - 1, 1));
}

export function money(cents: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
