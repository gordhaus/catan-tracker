/**
 * adaptiveDice.ts
 * -----------------
 * Two implementations of a “streak-taming” two-dice roller for sums 2..12:
 *
 * 1) AdaptiveDice (multiplicative weights around the true two-dice distribution)
 *    - Gradually counteracts short-run outliers with a tunable rate.
 * 2) ShuffleBagDice (finite bag sampled without replacement)
 *    - Guarantees exact proportions per bag; almost no streaks within a bag.
 *
 * Both use a strong RNG (Web Crypto). Works in browsers and Node ≥ 16.5 (webcrypto).
 *
 * -------------------------------------------------------------------------------
 * MATHEMATICAL MODEL (AdaptiveDice)
 * Let target probabilities for sums s∈{2..12} be p_s = [1,2,3,4,5,6,5,4,3,2,1]/36.
 * After t rolls, with counts c_s(t), empirical share is  ĉ_s(t) = c_s(t)/t.
 * Maintain an exponential moving error e_s := (1-β)e_s + β (ĉ_s - p_s).
 * Define weights via multiplicative-weights (“Hedge”):
 *     w_s ∝ p_s * exp(-η e_s) .
 * Mix with the target to keep a floor:
 *     q_s = (1-ε) w_s/Σw + ε p_s.
 * Sample next sum from q_s.
 *
 * PARAMETERS:
 *   β (beta)   ∈ (0,1]: adaptation rate (how quickly the EMA reacts).
 *   η (eta)    ≥ 0    : correction strength (how strongly you counter deviations).
 *   ε (epsilon)∈ [0,1]: safety mixing with the true dice to prevent overfitting.
 *
 * -------------------------------------------------------------------------------
 * REFERENCES (for further reading)
 * - Multiplicative Weights / Hedge:
 *   Freund, Schapire (1997): "A Decision-Theoretic Generalization of On-Line Learning..."
 * - Alias method for O(1) discrete sampling:
 *   Vose, M.D. (1991): "A Linear Algorithm for Generating Random Numbers with a Given Distribution."
 * - Exponential Moving Average (EMA): standard online estimator.
 * - Fisher–Yates / Knuth shuffle.
 * - Crypto RNG:
 *   Web Crypto API: crypto.getRandomValues (browser, Node webcrypto). Avoid modulo bias via rejection.
 */

import {
  DICE_OUTCOMES,
  DICE_OUTCOME_COUNTS,
  ensureDiceOutcome,
  type DiceOutcome,
} from "./diceConstants";

// Re-export DiceOutcome for convenience
export type { DiceOutcome } from "./diceConstants";

/* =========================== Types & Constants ============================ */

/** The eleven sums we can produce (2..12). */
export const SUMS: readonly DiceOutcome[] = DICE_OUTCOMES;

/** Two-dice (fair) target multiplicities for sums 2..12, total 36. */
export const TWO_DICE_COUNTS: Readonly<number[]> = Object.freeze(
  DICE_OUTCOMES.map((outcome) => DICE_OUTCOME_COUNTS[outcome])
);

/** Target probabilities p_s for sums 2..12. */
export const TARGET_P: Readonly<number[]> = Object.freeze(
  TWO_DICE_COUNTS.map((c) => c / 36)
);

/** Options for AdaptiveDice. */
export interface AdaptiveDiceOptions {
  /**
   * Exponential moving average rate β. Typical: 0.05–0.4 (default 0.4).
   * Higher β reacts faster to deviations; lower β is smoother.
   */
  beta?: number;
  /**
   * Multiplicative-weights strength η. Typical: 2–20 (default 20).
   * Larger η more aggressively suppresses currently overrepresented outcomes.
   */
  eta?: number;
  /**
   * Mixing weight ε with the true target distribution. Typical: 0.01–0.05 (default 0.01).
   * Keeps you anchored and prevents over-correction.
   */
  epsilon?: number;
}

/* ============================ Serializable State Types ============================ */

/** Dice mode type */
export type DiceMode = "real-life" | "adaptive" | "shuffle-bag";

/** Base interface for dice states that track rolls */
export interface DiceRolls {
  rolls?: DiceOutcome[]; // Optional roll history
}

/** Serializable state for real-life dice mode (no special state needed) */
export interface RealLifeDiceState extends DiceRolls {
  mode: "real-life";
}

/** Serializable state for AdaptiveDice */
export interface AdaptiveDiceState extends DiceRolls {
  mode: "adaptive";
  beta?: number;
  eta?: number;
  epsilon?: number;
}

/** Serializable state for ShuffleBagDice */
export interface ShuffleBagDiceState extends DiceRolls {
  mode: "shuffle-bag";
  bagSize?: number;
  bagPtr?: number;
}

/** Discriminated union of all dice mode states */
export type DiceState =
  | RealLifeDiceState
  | AdaptiveDiceState
  | ShuffleBagDiceState;

/** RNG interface used internally (float in [0,1), int in [0,max)). */
export interface RNG {
  float01(): number;
  int(maxExclusive: number): number;
}

/* =============================== RNG ===================================== */

/**
 * Strong RNG using Web Crypto (browser or Node webcrypto).
 * - float01(): uniform in [0, 1)
 * - int(max): uniform integer in {0,...,max-1} using rejection sampling (no modulo bias)
 */
export class CryptoRNG implements RNG {
  private g: Crypto;

  constructor() {
    // Support browser and Node >= 16.5 (globalThis.crypto.webcrypto)
    // Fallback for older Node (attempt dynamic import), but if not present, throw.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyGlobal = globalThis as any;
    if (anyGlobal.crypto?.getRandomValues) {
      this.g = anyGlobal.crypto as Crypto;
    } else if (anyGlobal.crypto?.webcrypto?.getRandomValues) {
      this.g = anyGlobal.crypto.webcrypto as Crypto;
    } else {
      // Attempt Node require without types (keeps file single-module).
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const nodeCrypto = require("node:crypto");
        this.g = nodeCrypto.webcrypto as Crypto;
      } catch {
        throw new Error(
          "No Web Crypto available. Use a modern browser or Node with webcrypto."
        );
      }
    }
  }

  float01(): number {
    const buf = new Uint32Array(1);
    this.g.getRandomValues(buf);
    // Scale to [0,1), keeping 1.0 unreachable
    return buf[0] / 2 ** 32;
  }

  int(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(
        "int(maxExclusive): maxExclusive must be a positive integer"
      );
    }
    // Rejection sampling to remove modulo bias
    const range = 2 ** 32;
    const limit = Math.floor(range / maxExclusive) * maxExclusive;
    const buf = new Uint32Array(1);
    let x: number;
    do {
      this.g.getRandomValues(buf);
      x = buf[0];
    } while (x >= limit);
    return x % maxExclusive;
  }
}

/* =============================== Alias =================================== */

/**
 * Vose alias table for O(1) discrete sampling.
 * Build cost O(n), sample cost O(1).
 */
export class Alias {
  private q: Float64Array;
  private J: Uint32Array;
  private n: number;
  private rng: RNG;

  constructor(probs: number[], rng: RNG) {
    this.rng = rng;
    this.q = new Float64Array(0);
    this.J = new Uint32Array(0);
    this.n = 0;
    this.build(probs);
  }

  /** Rebuild alias table for a new probability vector. */
  build(probs: number[]): void {
    const n = probs.length;
    if (n === 0) throw new Error("Alias.build: empty probability vector");

    // Normalize
    const sum = probs.reduce((a, b) => a + b, 0);
    if (!(sum > 0))
      throw new Error("Alias.build: probabilities must sum to > 0");
    const p = probs.map((x) => (x < 0 ? 0 : x) / sum);

    const q = new Float64Array(n);
    const J = new Uint32Array(n);
    const scaled = p.map((x) => x * n);
    const small: number[] = [];
    const large: number[] = [];
    scaled.forEach((x, i) => (x < 1 ? small : large).push(i));

    while (small.length && large.length) {
      const l = small.pop() as number;
      const g = large.pop() as number;
      q[l] = scaled[l];
      J[l] = g;
      scaled[g] = scaled[g] - (1 - scaled[l]);
      (scaled[g] < 1 ? small : large).push(g);
    }
    while (large.length) q[large.pop() as number] = 1;
    while (small.length) q[small.pop() as number] = 1;

    this.q = q;
    this.J = J;
    this.n = n;
  }

  /** Draw an index 0..n-1 according to the current table. */
  sampleIndex(): number {
    const i = this.rng.int(this.n);
    return this.rng.float01() < this.q[i] ? i : this.J[i];
  }
}

/* ============================ Real Dice ============================ */

/**
 * RealDice: Represents real physical dice with no algorithmic state.
 * Simply rolls two d6 and keeps track of roll history.
 */
export class RealDice {
  private readonly rng: RNG;
  private _rolls: DiceOutcome[];

  constructor(stateOrRng?: RealLifeDiceState | RNG) {
    // Check if we're restoring from state or getting an RNG
    const isState =
      stateOrRng && typeof stateOrRng === "object" && "mode" in stateOrRng;
    const state = isState ? (stateOrRng as RealLifeDiceState) : undefined;
    const rng = !isState && stateOrRng ? (stateOrRng as RNG) : new CryptoRNG();

    this.rng = rng;
    this._rolls = state?.rolls ?? [];
  }

  get rolls(): DiceOutcome[] {
    return this._rolls.slice();
  }

  /** Roll two d6 and return the sum */
  roll(): DiceOutcome {
    const d1 = this.rng.int(6) + 1;
    const d2 = this.rng.int(6) + 1;
    const outcome = ensureDiceOutcome(d1 + d2);
    this._rolls.push(outcome);
    return outcome;
  }

  /** Manually add a specific outcome (for real-life dice input) */
  addRoll(outcome: DiceOutcome): void {
    this._rolls.push(outcome);
  }

  /** Undo the last roll */
  undo(): void {
    if (this._rolls.length === 0) {
      throw new Error("Cannot undo: no rolls have been made");
    }
    this._rolls.pop();
  }

  /** Export current state for serialization */
  toState(): RealLifeDiceState {
    return {
      mode: "real-life",
      rolls: this._rolls.slice(),
    };
  }
}

/* ============================ Adaptive Dice ============================== */

/**
 * AdaptiveDice:
 * Rolls sums in {2..12} with probabilities that adapt to suppress short-run outliers,
 * while staying close to the true two-dice distribution.
 */
export class AdaptiveDice {
  private readonly beta: number;
  private readonly eta: number;
  private readonly epsilon: number;

  private readonly rng: RNG;
  private readonly alias: Alias;

  protected _rolls: DiceOutcome[]; // Actual roll sequence
  private e: number[]; // EMA errors
  private q: number[]; // last used distribution

  constructor(
    optionsOrState?: AdaptiveDiceOptions | AdaptiveDiceState,
    rng: RNG = new CryptoRNG()
  ) {
    // Check if we're restoring from state
    const isState = optionsOrState && "mode" in optionsOrState;
    const state = isState ? (optionsOrState as AdaptiveDiceState) : undefined;
    const options = isState ? {} : (optionsOrState as AdaptiveDiceOptions);

    this.beta = state?.beta ?? options?.beta ?? 0.4;
    this.eta = state?.eta ?? options?.eta ?? 20.0;
    this.epsilon = state?.epsilon ?? options?.epsilon ?? 0.01;

    // Validate parameters:

    if (!(this.beta > 0 && this.beta <= 1)) {
      throw new Error("beta must be in (0,1]");
    }
    if (!(this.eta >= 0)) {
      throw new Error("eta must be >= 0");
    }
    if (!(this.epsilon >= 0 && this.epsilon <= 1)) {
      throw new Error("epsilon must be in [0,1]");
    }

    this.rng = rng;
    this._rolls = state?.rolls ?? [];
    this.e = new Array(SUMS.length).fill(0);
    this.q = TARGET_P.slice();

    // Rebuild state from roll history
    if (this._rolls.length > 0) {
      this.rebuildFromRolls();
    }

    this.alias = new Alias(this.q, this.rng);
  }

  get rolls(): DiceOutcome[] {
    return this._rolls.slice();
  }

  /** Compute counts from roll history */
  private getCounts(): number[] {
    const counts = new Array(SUMS.length).fill(0);
    for (const roll of this._rolls) {
      const idx = roll - 2;
      counts[idx]++;
    }
    return counts;
  }

  /** Rebuild EMA errors and weights from roll history */
  private rebuildFromRolls(upToIndex?: number): void {
    // Reset EMA errors
    this.e.fill(0);

    const rollsToProcess =
      upToIndex !== undefined ? this._rolls.slice(0, upToIndex) : this._rolls;

    if (rollsToProcess.length === 0) {
      this.q = TARGET_P.slice();
      return;
    }

    // Replay rolls to rebuild EMA state
    const counts = new Array(SUMS.length).fill(0);
    let t = 0;

    for (const roll of rollsToProcess) {
      const idx = roll - 2;
      counts[idx]++;
      t++;

      // Update EMA errors incrementally
      for (let k = 0; k < this.e.length; k++) {
        const empirical = counts[k] / t;
        this.e[k] =
          (1 - this.beta) * this.e[k] + this.beta * (empirical - TARGET_P[k]);
      }
    }

    // Compute final weights
    this.computeWeights();
  }

  /** Compute weights from current EMA errors */
  private computeWeights(): void {
    // Multiplicative-weights correction around the target
    let w = this.e.map((ek, k) => TARGET_P[k] * Math.exp(-this.eta * ek));
    const wSum = w.reduce((a, b) => a + b, 0);
    if (!(wSum > 0)) w = TARGET_P.slice();
    else w = w.map((x) => x / wSum);

    // Mix with target to ensure a floor
    const q = w.map(
      (wk, k) => (1 - this.epsilon) * wk + this.epsilon * TARGET_P[k]
    );
    const qSum = q.reduce((a, b) => a + b, 0);
    this.q = q.map((x) => x / qSum);
  }

  /** Rebuild internal alias table from current weights */
  rebuild(): void {
    this.alias.build(this.q);
  }

  /**
   * Roll one adapted sum in {2..12}.
   * @returns The sum (integer 2..12).
   */
  roll(): DiceOutcome {
    const idx = this.alias.sampleIndex(); // 0..10
    const sum = SUMS[idx];

    // Add to roll history
    this._rolls.push(ensureDiceOutcome(sum));

    // Update EMA errors incrementally for the new roll
    const counts = this.getCounts();
    const t = this._rolls.length;
    for (let k = 0; k < this.e.length; k++) {
      const empirical = counts[k] / t;
      this.e[k] =
        (1 - this.beta) * this.e[k] + this.beta * (empirical - TARGET_P[k]);
    }

    // Recompute weights and rebuild alias table
    this.computeWeights();
    this.rebuild();

    return ensureDiceOutcome(sum);
  }

  /** Export current state for serialization. */
  toState(): AdaptiveDiceState {
    return {
      mode: "adaptive",
      beta: this.beta,
      eta: this.eta,
      epsilon: this.epsilon,
      rolls: this._rolls.slice(),
    };
  }

  /**
   * Undo the last roll.
   * Removes the last roll from history and rebuilds state from scratch.
   * This ensures perfect weight reconstruction.
   */
  undo(): void {
    if (this._rolls.length === 0) {
      throw new Error("Cannot undo: no rolls have been made");
    }

    // Remove last roll
    this._rolls.pop();

    // Rebuild state from remaining rolls
    this.rebuildFromRolls();
    this.rebuild();
  }
}

/* ============================ Shuffle-Bag Dice =========================== */

/**
 * ShuffleBagDice:
 * Builds a finite “bag” containing sums 2..12 with counts proportional to the true distribution,
 * then draws without replacement until the bag is empty; refills and reshuffles, repeat.
 *
 * If bagSize is a multiple of 36 (recommended), within each bag you match the true distribution exactly.
 * This virtually eliminates unlikely streaks inside a bag, but is less “random-feeling”.
 */
export class ShuffleBagDice {
  private readonly bagSize: number;
  private readonly rng: RNG;

  private rollsBag: DiceOutcome[] = [];
  private ptr = 0;

  /**
   * @param bagSizeOrState Bag size (number) or serialized state object.
   * @param rng RNG instance (defaults to CryptoRNG).
   */
  constructor(
    bagSizeOrState: number | ShuffleBagDiceState = 36,
    rng: RNG = new CryptoRNG()
  ) {
    const isState =
      typeof bagSizeOrState === "object" && "mode" in bagSizeOrState;
    const state = isState ? bagSizeOrState : undefined;
    const bagSize = isState ? (state!.bagSize ?? 36) : bagSizeOrState;

    if (!Number.isInteger(bagSize) || bagSize <= 0) {
      throw new Error("bagSize must be a positive integer");
    }
    if (bagSize % 36 !== 0) {
      throw new Error(
        "bagSize should be a multiple of 36 to preserve exact proportions"
      );
    }

    this.rng = rng;
    this.bagSize = bagSize;
    this.ptr = state?.bagPtr ?? 0;
    if (isState && state!.rolls !== undefined) {
      this.rollsBag = state!.rolls;
    }
  }

  get rolls(): DiceOutcome[] {
    return this.rollsBag.slice(0, this.ptr);
  }

  private extend() {
    const mult = this.bagSize / 36;
    const offset = this.rollsBag.length;
    for (let i = 0; i < TWO_DICE_COUNTS.length; i++) {
      const copies = TWO_DICE_COUNTS[i] * mult;
      for (let k = 0; k < copies; k++) this.rollsBag.push(SUMS[i]);
    }
    // Fisher–Yates using strong RNG
    for (let i = this.bagSize - 1; i > 0; i--) {
      const j = this.rng.int(i + 1);
      [this.rollsBag[offset + i], this.rollsBag[offset + j]] = [
        this.rollsBag[offset + j],
        this.rollsBag[offset + i],
      ];
    }
  }

  /** Draw one sum from the bag; refills automatically when exhausted. */
  roll(): DiceOutcome {
    if (this.ptr >= this.rollsBag.length) this.extend();
    return this.rollsBag[this.ptr++];
  }

  /** Export current state for serialization. */
  toState(): ShuffleBagDiceState {
    return {
      mode: "shuffle-bag",
      rolls: this.rollsBag.slice(),
      bagSize: this.bagSize,
      bagPtr: this.ptr,
    };
  }

  /**
   * Undo the last roll by moving the pointer back.
   * Note: Can only undo if ptr > 0 (not at the start of bag).
   */
  undo(): void {
    if (this.ptr === 0) {
      throw new Error("Cannot undo: at start of bag");
    }
    this.ptr -= 1;
  }
}

/* ============================ Functional API ============================ */

/**
 * Functional roll API: takes a DiceState, returns updated state and dice outcome.
 * For real-life mode, generates truly random rolls.
 * For adaptive/shuffle-bag, maintains algorithm state.
 */
export function roll(state: DiceState): {
  state: DiceState;
  outcome: DiceOutcome;
} {
  const dice = getDice(state);
  const outcome = dice.roll();
  return { state: dice.toState(), outcome };
}

/**
 * Undo the last roll for a given dice state.
 * Removes the last roll from the roll history.
 */
export function undo(state: DiceState): DiceState {
  const dice = getDice(state);
  dice.undo();
  return dice.toState();
}

export function rolls(state: DiceState): DiceOutcome[] {
  return getDice(state).rolls;
}

export function getDice(
  state: DiceState
): RealDice | AdaptiveDice | ShuffleBagDice {
  if (state.mode === "real-life") {
    return new RealDice(state);
  }

  if (state.mode === "adaptive") {
    return new AdaptiveDice(state);
  }

  if (state.mode === "shuffle-bag") {
    return new ShuffleBagDice(state);
  }

  // TypeScript exhaustiveness check
  const _exhaustive: never = state;
  throw new Error(`Unknown dice mode: ${(_exhaustive as DiceState).mode}`);
}

/* ============================ DiceManager Class ============================ */

/**
 * DiceManager wraps a DiceState and provides method-style access.
 *
 * This class bridges OOP-style method calls with React's immutable state model.
 * It's designed to work within the DiceContext "soft abstraction":
 *
 * - Accepts plain DiceState (serializable for localStorage)
 * - Provides methods that return new state (immutable updates)
 * - Works correctly whether state changes come through this manager or externally
 * - Enables natural method-style API: `manager.roll()` vs `roll(state)`
 *
 * USAGE:
 * Typically used via DiceProvider/useDiceOperations() in React components,
 * but can also be instantiated directly for functional/utility code.
 *
 * @example
 * ```typescript
 * // In React components (recommended):
 * const { roll, undo } = useDiceOperations();
 * roll(); // Automatically updates context state
 *
 * // Direct usage (for utilities/tests):
 * const manager = new DiceManager(diceState);
 * const [newState, outcome] = manager.roll();
 * ```
 */
export class DiceManager {
  private state: DiceState;
  private instance: RealDice | AdaptiveDice | ShuffleBagDice;

  constructor(state: DiceState) {
    this.state = state;
    this.instance = getDice(state);
  }

  /** Get the current state (plain object for serialization) */
  getState(): DiceState {
    return this.state;
  }

  /** Roll the dice and return [newState, outcome] */
  roll(): [DiceState, DiceOutcome] {
    const outcome = this.instance.roll();
    this.state = this.instance.toState();
    return [this.state, outcome];
  }

  /** Undo the last roll and return the new state */
  undo(): DiceState {
    this.instance.undo();
    this.state = this.instance.toState();
    return this.state;
  }

  /** Manually add a roll (for real-life dice mode only) */
  addRoll(outcome: DiceOutcome): DiceState {
    if (this.instance instanceof RealDice) {
      this.instance.addRoll(outcome);
      this.state = this.instance.toState();
      return this.state;
    }
    throw new Error("addRoll is only supported in real-life dice mode");
  }

  /** Get the roll history */
  get rolls(): DiceOutcome[] {
    return this.instance.rolls;
  }

  /** Get the dice mode */
  get mode(): DiceMode {
    return this.state.mode;
  }

  /** Create a new manager with fresh state (for React updates) */
  static from(state: DiceState): DiceManager {
    return new DiceManager(state);
  }
}

/**
 * Given a sum in 2..12, return a fair (d1,d2) pair with d1,d2∈{1..6}, d1+d2=sum.
 * Uniform among all feasible pairs.
 */
export function pair(
  sum: DiceOutcome,
  rng = new CryptoRNG()
): { d1: number; d2: number } {
  const minD1 = Math.max(1, sum - 6);
  const maxD1 = Math.min(6, sum - 1);
  const width = maxD1 - minD1 + 1;
  const d1 = minD1 + rng.int(width);
  const d2 = sum - d1;
  return { d1, d2 };
}
