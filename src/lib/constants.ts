import { MatchTier, SubscriptionPlan } from "@prisma/client";

export const APP_NAME = "Digital Heroes Impact Draw";

export const AUTH_COOKIE_NAME = "dh_session";
export const SESSION_DURATION = "30d";
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const SCORE_MIN = 1;
export const SCORE_MAX = 45;
export const MAX_STORED_SCORES = 5;

export const MIN_CHARITY_PERCENTAGE = 10;
export const DEFAULT_CHARITY_PERCENTAGE = 10;

export const PLAN_PRICE_CENTS: Record<SubscriptionPlan, number> = {
  MONTHLY: 1900,
  YEARLY: 19900,
};

export const DEFAULT_PRIZE_POOL_PERCENTAGE = 50;

export const MATCH_TIER_SHARE: Record<MatchTier, number> = {
  FIVE: 40,
  FOUR: 35,
  THREE: 25,
};

export const DRAW_PICK_COUNT = 5;
