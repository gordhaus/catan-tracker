/**
 * Shared constants and types for dice outcomes in Catan
 */

/** The possible dice outcomes in Catan (2-12) */
export const DICE_OUTCOMES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

/** Type representing a valid dice outcome */
export type DiceOutcome = (typeof DICE_OUTCOMES)[number];

/** Two-dice (fair) target multiplicities for sums 2..12, total 36 */
export const DICE_OUTCOME_COUNTS: Readonly<Record<DiceOutcome, number>> =
  Object.freeze({
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 5,
    9: 4,
    10: 3,
    11: 2,
    12: 1,
  } as const);

/** Target probabilities for each dice outcome (count / 36) */
export const DICE_OUTCOME_PROBABILITIES: Readonly<Record<DiceOutcome, number>> =
  Object.freeze({
    2: 1 / 36,
    3: 2 / 36,
    4: 3 / 36,
    5: 4 / 36,
    6: 5 / 36,
    7: 6 / 36,
    8: 5 / 36,
    9: 4 / 36,
    10: 3 / 36,
    11: 2 / 36,
    12: 1 / 36,
  } as const);

/**
 * Type guard to check if a value is a valid DiceOutcome
 */
export function isDiceOutcome(value: unknown): value is DiceOutcome {
  return (
    typeof value === "number" && DICE_OUTCOMES.includes(value as DiceOutcome)
  );
}

/**
 * Ensures a value is a valid DiceOutcome, throws if not
 */
export function ensureDiceOutcome(value: unknown): DiceOutcome {
  if (isDiceOutcome(value)) {
    return value;
  }
  throw new Error(`Value ${value} is not a valid DiceOutcome`);
}
