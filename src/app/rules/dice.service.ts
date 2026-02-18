import { Injectable } from '@angular/core';

/**
 * DiceService - Handles all dice rolling mechanics.
 *
 * Dice notation: XdY where X = number of dice, Y = sides per die.
 * Example: 2d6 = roll two six-sided dice.
 */
@Injectable({ providedIn: 'root' })
export class DiceService {

  /**
   * Roll a single die with the given number of sides.
   * Formula: random integer between 1 and sides (inclusive).
   */
  rollDie(sides: number): number {
    return Math.floor(Math.random() * sides) + 1;
  }

  /**
   * Roll multiple dice and return the total.
   * Formula: sum of (count) rolls of d(sides).
   */
  rollDice(count: number, sides: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += this.rollDie(sides);
    }
    return total;
  }

  /**
   * Roll multiple dice and return individual results.
   */
  rollDiceDetailed(count: number, sides: number): { rolls: number[]; total: number } {
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) {
      rolls.push(this.rollDie(sides));
    }
    return { rolls, total: rolls.reduce((sum, r) => sum + r, 0) };
  }

  /**
   * Parse a dice notation string (e.g. "2d6+3") and roll it.
   * Supported formats: "XdY", "XdY+Z", "XdY-Z"
   */
  rollNotation(notation: string): { rolls: number[]; modifier: number; total: number } {
    const match = notation.match(/^(\d+)d(\d+)([+-]\d+)?$/);
    if (!match) {
      throw new Error(`Invalid dice notation: ${notation}`);
    }
    const count = parseInt(match[1], 10);
    const sides = parseInt(match[2], 10);
    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    const result = this.rollDiceDetailed(count, sides);
    return {
      rolls: result.rolls,
      modifier,
      total: result.total + modifier,
    };
  }

  /**
   * Roll a standard d20 check.
   */
  rollD20(): number {
    return this.rollDie(20);
  }

  /**
   * Roll 4d6, drop the lowest - standard ability score generation.
   */
  rollAbilityScore(): { rolls: number[]; dropped: number; total: number } {
    const rolls = [this.rollDie(6), this.rollDie(6), this.rollDie(6), this.rollDie(6)];
    const sorted = [...rolls].sort((a, b) => a - b);
    const dropped = sorted[0];
    const total = sorted[1] + sorted[2] + sorted[3];
    return { rolls, dropped, total };
  }
}
