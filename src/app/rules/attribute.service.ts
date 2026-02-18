import { Injectable } from '@angular/core';
import { Attributes, Character, ActiveEffect } from '../shared/models/character.model';
import { EffectService } from './effect.service';

/**
 * AttributeService - Handles all attribute calculations per D&D 3.5 rules.
 *
 * CORE FORMULA - Attribute Modifier:
 *   modifier = floor((attributeValue - 10) / 2)
 *
 * This is the foundational formula used throughout the system.
 * Modify the calculateModifier() method to change how modifiers are derived.
 */
@Injectable({ providedIn: 'root' })
export class AttributeService {

  constructor(private effectService: EffectService) {}

  /**
   * Calculate the ability modifier for a given attribute value.
   *
   * D&D 3.5 FORMULA: modifier = floor((score - 10) / 2)
   *
   * Examples:
   *   score 10 → modifier 0
   *   score 14 → modifier +2
   *   score 8  → modifier -1
   *   score 20 → modifier +5
   */
  calculateModifier(score: number): number {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Get the effective attribute value after applying active effects.
   *
   * FORMULA: baseValue + sum(all applicable effect modifiers)
   */
  getEffectiveAttribute(character: Character, attribute: keyof Attributes): number {
    const baseValue = character.attributes[attribute];
    const effectBonus = this.effectService.getTotalModifier(character.activeEffects, attribute);
    return baseValue + effectBonus;
  }

  /**
   * Get the effective modifier for an attribute (including effects).
   *
   * FORMULA: floor((effectiveAttribute - 10) / 2)
   */
  getEffectiveModifier(character: Character, attribute: keyof Attributes): number {
    const effectiveScore = this.getEffectiveAttribute(character, attribute);
    return this.calculateModifier(effectiveScore);
  }

  /**
   * Get all attribute modifiers at once.
   */
  getAllModifiers(character: Character): Record<keyof Attributes, number> {
    return {
      strength: this.getEffectiveModifier(character, 'strength'),
      dexterity: this.getEffectiveModifier(character, 'dexterity'),
      constitution: this.getEffectiveModifier(character, 'constitution'),
      intelligence: this.getEffectiveModifier(character, 'intelligence'),
      wisdom: this.getEffectiveModifier(character, 'wisdom'),
      charisma: this.getEffectiveModifier(character, 'charisma'),
    };
  }

  /**
   * Size modifier for attack rolls and AC.
   *
   * D&D 3.5 SIZE MODIFIERS:
   *   Fine: +8, Diminutive: +4, Tiny: +2, Small: +1
   *   Medium: 0, Large: -1, Huge: -2, Gargantuan: -4, Colossal: -8
   */
  getSizeModifier(size: Character['size']): number {
    const sizeModifiers: Record<Character['size'], number> = {
      fine: 8,
      diminutive: 4,
      tiny: 2,
      small: 1,
      medium: 0,
      large: -1,
      huge: -2,
      gargantuan: -4,
      colossal: -8,
    };
    return sizeModifiers[size] ?? 0;
  }
}
