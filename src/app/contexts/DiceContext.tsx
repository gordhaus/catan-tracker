"use client";
import React, { createContext, useContext, useMemo } from "react";
import {
  DiceManager,
  type DiceState,
  type DiceOutcome,
} from "../lib/adaptiveDice";

/**
 * DiceContext - Soft Abstraction for Dice State Management
 *
 * This context provides a convenient OOP-style API (DiceManager) for working with
 * dice state while maintaining React's immutable state model.
 *
 * ARCHITECTURE NOTES:
 * - "Soft abstraction": Components CAN directly modify diceState via setState,
 *   but SHOULD use useDiceOperations() for better encapsulation
 * - DiceManager is recreated whenever diceState changes (via any means)
 * - Direct state modification will still work correctly, but bypasses the abstraction
 * - State remains serializable (plain objects) for localStorage persistence
 *
 * USAGE:
 *   Preferred:   const { roll, undo } = useDiceOperations();
 *   Discouraged: setState(s => ({ ...s, diceState: newDiceState }));
 */

interface DiceContextValue {
  diceManager: DiceManager;
  updateDiceState: (newState: DiceState) => void;
}

const DiceContext = createContext<DiceContextValue | null>(null);

interface DiceProviderProps {
  diceState: DiceState;
  onDiceStateChange: (newState: DiceState) => void;
  children: React.ReactNode;
}

/**
 * Provider that creates and manages a DiceManager instance.
 *
 * The manager is automatically recreated when diceState changes, whether the change
 * came through the context API (updateDiceState) or directly via setState.
 * This makes the abstraction resilient to both usage patterns.
 *
 * @param diceState - Current dice state (plain object, serializable)
 * @param onDiceStateChange - Callback to update parent state
 * @param children - Child components that can access the context
 */
export function DiceProvider({
  diceState,
  onDiceStateChange,
  children,
}: DiceProviderProps) {
  const diceManager = useMemo(() => new DiceManager(diceState), [diceState]);

  const contextValue = useMemo(
    () => ({
      diceManager,
      updateDiceState: onDiceStateChange,
    }),
    [diceManager, onDiceStateChange]
  );

  return (
    <DiceContext.Provider value={contextValue}>{children}</DiceContext.Provider>
  );
}

/**
 * Hook to access the DiceManager from any component.
 *
 * Use this for advanced scenarios where you need direct access to the manager.
 * For most use cases, prefer useDiceOperations() instead.
 *
 * @throws Error if used outside of DiceProvider
 */
export function useDice(): DiceContextValue {
  const context = useContext(DiceContext);
  if (!context) {
    throw new Error("useDice must be used within a DiceProvider");
  }
  return context;
}

/**
 * Convenience hook that returns commonly used dice operations.
 *
 * This is the RECOMMENDED way to interact with dice state in components.
 * It provides a clean, functional API that automatically handles state updates.
 *
 * @returns Object with dice operations and state access
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { roll, undo, rolls, mode } = useDiceOperations();
 *
 *   return (
 *     <button onClick={roll}>Roll: {rolls.length}</button>
 *   );
 * }
 * ```
 */
export function useDiceOperations() {
  const { diceManager, updateDiceState } = useDice();

  return {
    diceManager,
    rolls: diceManager.rolls,
    mode: diceManager.mode,

    /** Roll the dice and automatically update state */
    roll: () => {
      const [newState, outcome] = diceManager.roll();
      updateDiceState(newState);
      return outcome;
    },

    /** Undo the last roll and automatically update state */
    undo: () => {
      const newState = diceManager.undo();
      updateDiceState(newState);
    },

    /** Manually add a roll (real-life dice mode only) and automatically update state */
    addRoll: (outcome: DiceOutcome) => {
      const newState = diceManager.addRoll(outcome);
      updateDiceState(newState);
    },
  };
}
