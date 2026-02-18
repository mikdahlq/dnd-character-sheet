import { Injectable } from '@angular/core';
import { Character, Equipment } from '../shared/models/character.model';
import { AttributeService } from './attribute.service';
import { EffectService } from './effect.service';
import { DiceService } from './dice.service';

export interface AttackResult {
  attackRoll: number;
  naturalRoll: number;
  totalAttackBonus: number;
  isCriticalThreat: boolean;
  damageRoll: number;
  breakdown: AttackBreakdown;
}

export interface AttackBreakdown {
  baseAttackBonus: number;
  abilityModifier: number;
  sizeModifier: number;
  enhancementBonus: number;
  effectBonuses: number;
  otherBonuses: number;
}

/**
 * AttackService - Handles all attack roll and damage calculations.
 *
 * D&D 3.5 ATTACK ROLL FORMULA:
 *   Attack Roll = 1d20 + BAB + Ability Modifier + Size Modifier + Enhancement Bonus + Other Modifiers
 *
 * MELEE ATTACK:
 *   Attack = 1d20 + BAB + STR modifier + size modifier + enhancement + effects
 *
 * RANGED ATTACK:
 *   Attack = 1d20 + BAB + DEX modifier + size modifier + enhancement + effects
 *
 * DAMAGE FORMULA:
 *   Melee Damage = weapon damage dice + STR modifier + enhancement bonus + effects
 *   Ranged Damage = weapon damage dice + enhancement bonus + effects
 *   (Two-handed melee: STR modifier × 1.5, Off-hand: STR modifier × 0.5)
 *
 * Modify the methods below to adjust these formulas.
 */
@Injectable({ providedIn: 'root' })
export class AttackService {

  constructor(
    private attributeService: AttributeService,
    private effectService: EffectService,
    private diceService: DiceService,
  ) {}

  /**
   * Calculate the total attack bonus (without rolling).
   *
   * FORMULA: BAB + abilityMod + sizeMod + enhancementBonus + effectBonuses
   */
  calculateAttackBonus(character: Character, weapon: Equipment): number {
    const breakdown = this.getAttackBreakdown(character, weapon);
    return breakdown.baseAttackBonus
      + breakdown.abilityModifier
      + breakdown.sizeModifier
      + breakdown.enhancementBonus
      + breakdown.effectBonuses;
  }

  /**
   * Get a detailed breakdown of the attack bonus components.
   */
  getAttackBreakdown(character: Character, weapon: Equipment): AttackBreakdown {
    // Determine ability modifier: STR for melee, DEX for ranged
    const abilityKey = weapon.weaponType === 'ranged' ? 'dexterity' : 'strength';
    const abilityModifier = this.attributeService.getEffectiveModifier(character, abilityKey);

    const sizeModifier = this.attributeService.getSizeModifier(character.size);
    const enhancementBonus = weapon.enhancementBonus ?? 0;
    const effectBonuses = this.effectService.getTotalModifier(character.activeEffects, 'attack');

    return {
      baseAttackBonus: character.baseAttackBonus,
      abilityModifier,
      sizeModifier,
      enhancementBonus,
      effectBonuses,
      otherBonuses: 0,
    };
  }

  /**
   * Perform a full attack roll with a weapon.
   *
   * FORMULA:
   *   naturalRoll = 1d20
   *   totalAttack = naturalRoll + attackBonus
   *   criticalThreat = naturalRoll >= weapon.criticalRange (default 20)
   */
  rollAttack(character: Character, weapon: Equipment): AttackResult {
    const breakdown = this.getAttackBreakdown(character, weapon);
    const totalAttackBonus = breakdown.baseAttackBonus
      + breakdown.abilityModifier
      + breakdown.sizeModifier
      + breakdown.enhancementBonus
      + breakdown.effectBonuses
      + breakdown.otherBonuses;

    const naturalRoll = this.diceService.rollD20();
    const attackRoll = naturalRoll + totalAttackBonus;

    // Critical threat range: parse from weapon (e.g., "19-20" → 19)
    const critRange = this.parseCriticalRange(weapon.criticalRange || '20');
    const isCriticalThreat = naturalRoll >= critRange;

    // Roll damage
    const damageRoll = this.rollDamage(character, weapon, isCriticalThreat);

    return {
      attackRoll,
      naturalRoll,
      totalAttackBonus,
      isCriticalThreat,
      damageRoll,
      breakdown,
    };
  }

  /**
   * Calculate damage for an attack.
   *
   * MELEE DAMAGE FORMULA:
   *   damage = weaponDice + STR modifier + enhancement + effects
   *
   * RANGED DAMAGE FORMULA:
   *   damage = weaponDice + enhancement + effects
   *
   * CRITICAL HIT: multiply all damage by criticalMultiplier (default x2)
   */
  rollDamage(character: Character, weapon: Equipment, isCritical: boolean): number {
    const damageNotation = weapon.damage || '1d4';
    const diceResult = this.diceService.rollNotation(damageNotation);

    // STR modifier for melee damage
    let strBonus = 0;
    if (weapon.weaponType === 'melee' || !weapon.weaponType) {
      strBonus = this.attributeService.getEffectiveModifier(character, 'strength');
    }

    const enhancementBonus = weapon.enhancementBonus ?? 0;
    const effectBonus = this.effectService.getTotalModifier(character.activeEffects, 'damage');

    let totalDamage = diceResult.total + strBonus + enhancementBonus + effectBonus;

    // Apply critical multiplier
    if (isCritical) {
      const multiplier = weapon.criticalMultiplier ?? 2;
      totalDamage *= multiplier;
    }

    // Minimum 1 damage (nonlethal floor)
    return Math.max(1, totalDamage);
  }

  /**
   * Get all iterative attacks for a character based on BAB.
   *
   * D&D 3.5 ITERATIVE ATTACKS:
   *   BAB +6 or higher: second attack at BAB-5
   *   BAB +11 or higher: third attack at BAB-10
   *   BAB +16 or higher: fourth attack at BAB-15
   */
  getIterativeAttacks(character: Character): number[] {
    const bab = character.baseAttackBonus;
    const attacks: number[] = [bab];

    if (bab >= 6) attacks.push(bab - 5);
    if (bab >= 11) attacks.push(bab - 10);
    if (bab >= 16) attacks.push(bab - 15);

    return attacks;
  }

  /**
   * Parse critical range string (e.g., "19-20") to minimum threat value.
   */
  private parseCriticalRange(range: string): number {
    if (range.includes('-')) {
      return parseInt(range.split('-')[0], 10);
    }
    return parseInt(range, 10) || 20;
  }
}
