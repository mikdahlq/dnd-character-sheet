import { Injectable } from '@angular/core';
import { ActiveEffect, EffectModifier, BonusType } from '../shared/models/character.model';

/**
 * EffectService - Handles active effects and bonus stacking rules.
 *
 * D&D 3.5 STACKING RULES:
 *   - Bonuses of the SAME type generally do NOT stack (only the highest applies).
 *   - EXCEPTIONS: Dodge bonuses and Circumstance bonuses DO stack.
 *   - Untyped bonuses always stack.
 *
 * Modify the STACKING_TYPES set below to change which bonus types stack.
 */
@Injectable({ providedIn: 'root' })
export class EffectService {

  /**
   * Bonus types that stack with themselves.
   * Add or remove types here to change stacking rules.
   */
  private readonly STACKING_TYPES: Set<BonusType> = new Set([
    'dodge',
    'circumstance',
    'untyped',
  ]);

  /**
   * Check if a bonus type stacks with itself.
   */
  doesStack(bonusType: BonusType): boolean {
    return this.STACKING_TYPES.has(bonusType);
  }

  /**
   * Calculate the total modifier for a given target stat from active effects.
   *
   * STACKING FORMULA:
   *   1. Group modifiers by bonus type.
   *   2. For stacking types: sum all values.
   *   3. For non-stacking types: take only the highest value.
   *   4. Return sum of all groups.
   */
  getTotalModifier(effects: ActiveEffect[], target: string): number {
    const activeModifiers = this.getActiveModifiersForTarget(effects, target);

    // Group by bonus type
    const grouped = new Map<BonusType, number[]>();
    for (const mod of activeModifiers) {
      const existing = grouped.get(mod.bonusType) || [];
      existing.push(mod.value);
      grouped.set(mod.bonusType, existing);
    }

    let total = 0;
    for (const [bonusType, values] of grouped.entries()) {
      if (this.doesStack(bonusType)) {
        // Stacking: sum all values
        total += values.reduce((sum, v) => sum + v, 0);
      } else {
        // Non-stacking: highest value only
        total += Math.max(...values);
      }
    }

    return total;
  }

  /**
   * Get all active modifiers that affect a specific target.
   */
  getActiveModifiersForTarget(effects: ActiveEffect[], target: string): EffectModifier[] {
    return effects
      .filter(e => e.active)
      .flatMap(e => e.modifiers)
      .filter(m => m.target === target);
  }

  /**
   * Get a breakdown of all active modifiers for a target.
   */
  getModifierBreakdown(effects: ActiveEffect[], target: string): { source: string; bonusType: BonusType; value: number }[] {
    const breakdown: { source: string; bonusType: BonusType; value: number }[] = [];
    for (const effect of effects.filter(e => e.active)) {
      for (const mod of effect.modifiers.filter(m => m.target === target)) {
        breakdown.push({
          source: effect.name,
          bonusType: mod.bonusType,
          value: mod.value,
        });
      }
    }
    return breakdown;
  }
}
