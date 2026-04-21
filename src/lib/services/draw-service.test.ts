import assert from "node:assert/strict";
import test from "node:test";

import {
  calculatePoolBreakdown,
  evaluateCandidates,
  hasMinimumScoresForDraw,
  mapMatchedCountToTier,
  pickAlgorithmicDrawNumbers,
  pickRandomDrawNumbers,
  type DrawParticipant,
} from "@/lib/services/draw-service";

test("pickRandomDrawNumbers returns 5 unique values in Stableford range", () => {
  const result = pickRandomDrawNumbers();

  assert.equal(result.length, 5);
  assert.equal(new Set(result).size, 5);
  for (const value of result) {
    assert.ok(value >= 1 && value <= 45);
  }
});

test("pickAlgorithmicDrawNumbers produces deterministic 5 unique picks from data", () => {
  const participants: DrawParticipant[] = [
    { userId: "u1", scoreValues: [30, 30, 28, 40, 12] },
    { userId: "u2", scoreValues: [30, 29, 12, 35, 40] },
    { userId: "u3", scoreValues: [30, 12, 11, 10, 9] },
  ];

  const numbers = pickAlgorithmicDrawNumbers(participants);

  assert.equal(numbers.length, 5);
  assert.equal(new Set(numbers).size, 5);
  assert.ok(numbers.includes(30));
  assert.ok(numbers.includes(12));
});

test("calculatePoolBreakdown applies PRD shares and rollover correctly", () => {
  const result = calculatePoolBreakdown(10_000, 500);

  assert.deepEqual(result, {
    poolTotalCents: 10_500,
    tier5Cents: 4_500,
    tier4Cents: 3_500,
    tier3Cents: 2_500,
  });
});

test("mapMatchedCountToTier maps counts to draw tiers", () => {
  assert.equal(mapMatchedCountToTier(5), "FIVE");
  assert.equal(mapMatchedCountToTier(4), "FOUR");
  assert.equal(mapMatchedCountToTier(3), "THREE");
  assert.equal(mapMatchedCountToTier(2), null);
});

test("hasMinimumScoresForDraw enforces minimum five-score rule", () => {
  assert.equal(hasMinimumScoresForDraw(4), false);
  assert.equal(hasMinimumScoresForDraw(5), true);
  assert.equal(hasMinimumScoresForDraw(6), true);
});

test("evaluateCandidates places users into correct prize tiers", () => {
  const participants: DrawParticipant[] = [
    { userId: "u1", scoreValues: [1, 2, 3, 4, 5] },
    { userId: "u2", scoreValues: [1, 2, 3, 9, 10] },
    { userId: "u3", scoreValues: [1, 2, 8, 9, 10] },
  ];

  const candidates = evaluateCandidates(participants, [1, 2, 3, 4, 5]);

  assert.equal(candidates.FIVE.length, 1);
  assert.equal(candidates.FOUR.length, 0);
  assert.equal(candidates.THREE.length, 1);
  assert.equal(candidates.FIVE[0].userId, "u1");
  assert.equal(candidates.THREE[0].userId, "u2");
});
