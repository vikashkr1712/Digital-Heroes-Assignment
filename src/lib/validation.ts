import { DrawLogic, SubscriptionPlan, SubscriptionStatus, UserRole } from "@prisma/client";
import { z } from "zod";

import {
  DEFAULT_CHARITY_PERCENTAGE,
  MIN_CHARITY_PERCENTAGE,
  SCORE_MAX,
  SCORE_MIN,
} from "@/lib/constants";

const dateStringSchema = z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
  message: "Invalid date format",
});

const monthKeySchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM format");

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
  charityId: z.string().cuid().optional(),
  charityPercentage: z
    .coerce.number()
    .int()
    .min(MIN_CHARITY_PERCENTAGE)
    .max(100)
    .default(DEFAULT_CHARITY_PERCENTAGE),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(72),
});

export const subscriptionSchema = z.object({
  plan: z.nativeEnum(SubscriptionPlan),
});

export const scoreCreateSchema = z.object({
  score: z.coerce.number().int().min(SCORE_MIN).max(SCORE_MAX),
  scoreDate: dateStringSchema,
});

export const scoreUpdateSchema = z.object({
  scoreId: z.string().cuid(),
  score: z.coerce.number().int().min(SCORE_MIN).max(SCORE_MAX),
  scoreDate: dateStringSchema,
});

export const scoreDeleteSchema = z.object({
  scoreId: z.string().cuid(),
});

export const drawActionSchema = z.object({
  action: z.enum(["simulate", "publish"]),
  monthKey: monthKeySchema.optional(),
  logic: z.nativeEnum(DrawLogic).default(DrawLogic.RANDOM),
});

export const donationSchema = z.object({
  charityId: z.string().cuid(),
  amountCents: z.coerce.number().int().min(100),
});

export const winnerProofSchema = z.object({
  winnerId: z.string().cuid(),
  proofUrl: z.string().url(),
});

export const adminWinnerReviewSchema = z.object({
  winnerId: z.string().cuid(),
  action: z.enum(["approve", "reject", "markPaid"]),
  reviewNote: z.string().trim().max(500).optional(),
});

export const adminCharityCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(1200),
  imageUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  upcomingEvent: z.string().trim().max(200).optional(),
  featured: z.boolean().optional(),
});

export const adminCharityUpdateSchema = adminCharityCreateSchema.extend({
  charityId: z.string().cuid(),
  isActive: z.boolean().optional(),
});

export const adminCharityDeleteSchema = z.object({
  charityId: z.string().cuid(),
});

export const adminUserUpdateSchema = z.object({
  userId: z.string().cuid(),
  name: z.string().trim().min(2).max(80).optional(),
  role: z.nativeEnum(UserRole).optional(),
  charityPercentage: z.coerce.number().int().min(MIN_CHARITY_PERCENTAGE).max(100).optional(),
});

export const adminSubscriptionUpdateSchema = z.object({
  userId: z.string().cuid(),
  status: z.nativeEnum(SubscriptionStatus),
});

export const adminScoreUpdateSchema = z.object({
  scoreId: z.string().cuid(),
  score: z.coerce.number().int().min(SCORE_MIN).max(SCORE_MAX),
  scoreDate: dateStringSchema,
});

export const adminScoreDeleteSchema = z.object({
  scoreId: z.string().cuid(),
});
