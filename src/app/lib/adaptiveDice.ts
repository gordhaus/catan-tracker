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
  /**
   * If true (default), rebuild the alias table every roll for maximum responsiveness.
   * If false, you can call .rebuild() manually (e.g., every k steps) to amortize cost.
   */
  rebuildEachRoll?: boolean;
}

/** Minimal stats snapshot for diagnostics/UI. */
export interface DiceStats {
  /** Number of rolls so far. */
  t: number;
  /** Counts per sum index (index 0 ↔ sum 2, ..., index 10 ↔ sum 12). */
  counts: number[];
  /** Empirical frequencies per sum. */
  empirical: number[];
  /** Empirical minus target per sum (positive means overrepresented so far). */
  diff: number[];
  /** Current sampling distribution q (if available). */
  q?: number[];
}

/* ============================ Serializable State Types ============================ */

/** Dice mode type */
export type DiceMode = "real-life" | "adaptive" | "shuffle-bag";

/** Serializable state for real-life dice mode (no special state needed) */
export interface RealLifeDiceState {
  mode: "real-life";
}

/** Serializable state for AdaptiveDice */
export interface AdaptiveDiceState {
  mode: "adaptive";
  beta?: number;
  eta?: number;
  epsilon?: number;
  counts?: number[];
  emaErrors?: number[];
  t?: number;
}

/** Serializable state for ShuffleBagDice */
export interface ShuffleBagDiceState {
  mode: "shuffle-bag";
  bagSize?: number;
  currentBag?: number[];
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
  private readonly rebuildEachRoll: boolean;

  private readonly rng: RNG;
  private readonly alias: Alias;

  private t: number;
  private counts: number[];
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
    this.rebuildEachRoll = options?.rebuildEachRoll ?? true;

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
    this.t = state?.t ?? 0;
    this.counts = state?.counts ?? new Array(SUMS.length).fill(0);
    this.e = state?.emaErrors ?? new Array(SUMS.length).fill(0);
    this.q = TARGET_P.slice();

    this.alias = new Alias(this.q, this.rng);
  }

  /** Current sampling distribution q (normalized). */
  private computeQ(): number[] {
    // Update EMA error against target using current empirical shares
    const denom = Math.max(1, this.t); // avoid division by zero at t=0
    for (let k = 0; k < this.e.length; k++) {
      const empirical = this.counts[k] / denom;
      this.e[k] =
        (1 - this.beta) * this.e[k] + this.beta * (empirical - TARGET_P[k]);
    }

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
    return q.map((x) => x / qSum);
  }

  /** Rebuild internal alias table from the latest q (useful if rebuildEachRoll=false). */
  rebuild(): void {
    this.q = this.computeQ();
    this.alias.build(this.q);
  }

  /**
   * Roll one adapted sum in {2..12}.
   * @returns The sum (integer 2..12).
   */
  roll(): DiceOutcome {
    if (this.rebuildEachRoll) this.rebuild();
    const idx = this.alias.sampleIndex(); // 0..10
    const sum = SUMS[idx];
    // Bookkeeping
    this.t += 1;
    this.counts[idx] += 1;
    return ensureDiceOutcome(sum);
  }

  /**
   * Roll one adapted sum, and also a fair pair (d1,d2) that realizes that sum.
   * Uniform among all pairs that add to the sampled sum.
   */
  rollWithPair(): { sum: number; d1: number; d2: number } {
    const sum = this.roll();
    // Sample a fair pair among feasible (d1,d2) with d1,d2∈{1..6}, d1+d2=sum
    const minD1 = Math.max(1, sum - 6);
    const maxD1 = Math.min(6, sum - 1);
    const width = maxD1 - minD1 + 1;
    const d1 = minD1 + this.rng.int(width);
    const d2 = sum - d1;
    return { sum, d1, d2 };
  }

  /** Get a snapshot of usage statistics and the last distribution q. */
  stats(): DiceStats {
    const empirical = this.counts.map((c) => (this.t ? c / this.t : 0));
    const diff = empirical.map((x, k) => x - TARGET_P[k]);
    return {
      t: this.t,
      counts: this.counts.slice(),
      empirical,
      diff,
      q: this.q.slice(),
    };
  }

  /** Export current state for serialization. */
  toState(): AdaptiveDiceState {
    return {
      mode: "adaptive",
      beta: this.beta,
      eta: this.eta,
      epsilon: this.epsilon,
      counts: this.counts.slice(),
      emaErrors: this.e.slice(),
      t: this.t,
    };
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

  private bag: number[] = [];
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
    const bagSize = isState ? state!.bagSize ?? 36 : bagSizeOrState;

    if (!Number.isInteger(bagSize) || bagSize <= 0) {
      throw new Error("bagSize must be a positive integer");
    }
    if (bagSize % 36 !== 0) {
      throw new Error(
        "bagSize should be a multiple of 36 to preserve exact proportions"
      );
    }
    this.bagSize = bagSize;
    this.rng = rng;

    // Restore from state or initialize fresh
    if (state?.currentBag && state.bagPtr !== undefined) {
      this.bag = state.currentBag;
      this.ptr = state.bagPtr;
    } else {
      this.refill();
    }
  }

  private refill(): void {
    this.bag = [];
    const mult = this.bagSize / 36;
    for (let i = 0; i < TWO_DICE_COUNTS.length; i++) {
      const copies = TWO_DICE_COUNTS[i] * mult;
      for (let k = 0; k < copies; k++) this.bag.push(SUMS[i]);
    }
    // Fisher–Yates using strong RNG
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = this.rng.int(i + 1);
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
    this.ptr = 0;
  }

  /** Draw one sum from the bag; refills automatically when exhausted. */
  roll(): number {
    if (this.ptr >= this.bag.length) this.refill();
    return this.bag[this.ptr++];
  }

  /**
   * Roll a sum and a fair pair (d1,d2) realizing that sum (uniform among feasible pairs).
   */
  rollWithPair(): { sum: number; d1: number; d2: number } {
    const sum = this.roll();
    const minD1 = Math.max(1, sum - 6);
    const maxD1 = Math.min(6, sum - 1);
    const width = maxD1 - minD1 + 1;
    const d1 = minD1 + this.rng.int(width);
    const d2 = sum - d1;
    return { sum, d1, d2 };
  }

  /** Export current state for serialization. */
  toState(): ShuffleBagDiceState {
    return {
      mode: "shuffle-bag",
      bagSize: this.bagSize,
      currentBag: this.bag.slice(),
      bagPtr: this.ptr,
    };
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
  const rng = new CryptoRNG();

  if (state.mode === "real-life") {
    // Real dice: just roll two d6
    const d1 = rng.int(6) + 1;
    const d2 = rng.int(6) + 1;
    const outcome = ensureDiceOutcome(d1 + d2);
    return { state, outcome };
  }

  if (state.mode === "adaptive") {
    const dice = new AdaptiveDice(state, rng);
    const outcome = dice.roll();
    return { state: dice.toState(), outcome };
  }

  if (state.mode === "shuffle-bag") {
    const dice = new ShuffleBagDice(state, rng);
    const outcome = ensureDiceOutcome(dice.roll());
    return { state: dice.toState(), outcome };
  }

  // TypeScript exhaustiveness check
  const _exhaustive: never = state;
  throw new Error(`Unknown dice mode: ${(_exhaustive as DiceState).mode}`);
}

