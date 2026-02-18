import { Injectable } from '@angular/core';
import { Character, Equipment } from '../shared/models/character.model';
import { AttributeService } from './attribute.service';
import { EffectService } from './effect.service';

export interface ACBreakdown {
  base: number;
  armorBonus: number;
  shieldBonus: number;
  dexModifier: number;
  sizeModifier: number;
  naturalArmor: number;
  deflectionBonus: number;
  miscBonus: number;
  total: number;
  touchAC: number;
  flatFootedAC: number;
}

/**
 * EquipmentService - Handles AC, equipment, and defense calculations.
 *
 * D&D 3.5 ARMOR CLASS FORMULA:
 *   AC = 10 + Armor Bonus + Shield Bonus + DEX Modifier + Size Modifier
 *        + Natural Armor + Deflection Bonus + Misc Modifiers
 *
 * TOUCH AC (ignores armor, shield, natural armor):
 *   Touch AC = 10 + DEX Modifier + Size Modifier + Deflection Bonus
 *
 * FLAT-FOOTED AC (ignores DEX and dodge):
 *   Flat-Footed AC = AC - DEX Modifier (if positive) - Dodge Bonuses
 *
 * DEX TO AC: Limited by armor's Max Dex Bonus.
 */
@Injectable({ providedIn: 'root' })
export class EquipmentService {

  constructor(
    private attributeService: AttributeService,
    private effectService: EffectService,
  ) {}

  /**
   * Calculate full AC breakdown.
   *
   * FORMULA: 10 + armor + shield + DEX(capped) + size + natural + deflection + misc
   */
  calculateAC(character: Character): ACBreakdown {
    const base = 10;

    // Get equipped armor and shield
    const equippedArmor = character.equipment.find(e => e.type === 'armor' && e.equipped);
    const equippedShield = character.equipment.find(e => e.type === 'shield' && e.equipped);

    const armorBonus = (equippedArmor?.armorBonus ?? 0)
      + this.effectService.getTotalModifier(character.activeEffects, 'armor_ac');
    const shieldBonus = (equippedShield?.shieldBonus ?? 0)
      + this.effectService.getTotalModifier(character.activeEffects, 'shield_ac');

    // DEX modifier, capped by armor's max dex bonus
    const rawDexMod = this.attributeService.getEffectiveModifier(character, 'dexterity');
    const maxDexBonus = equippedArmor?.maxDexBonus ?? 99;
    const dexModifier = Math.min(rawDexMod, maxDexBonus);

    const sizeModifier = this.attributeService.getSizeModifier(character.size);
    const naturalArmor = character.naturalArmor
      + this.effectService.getTotalModifier(character.activeEffects, 'natural_armor');
    const deflectionBonus = this.effectService.getTotalModifier(character.activeEffects, 'ac_deflection');
    const miscBonus = this.effectService.getTotalModifier(character.activeEffects, 'ac');

    const total = base + armorBonus + shieldBonus + dexModifier + sizeModifier
      + naturalArmor + deflectionBonus + miscBonus;

    // Touch AC: excludes armor, shield, natural armor
    const touchAC = base + dexModifier + sizeModifier + deflectionBonus + miscBonus;

    // Flat-footed AC: excludes positive DEX modifier
    const flatFootedDex = Math.min(dexModifier, 0);
    const dodgeBonus = this.effectService.getTotalModifier(character.activeEffects, 'ac_dodge');
    const flatFootedAC = total - (dexModifier > 0 ? dexModifier : 0) - dodgeBonus + flatFootedDex;

    return {
      base,
      armorBonus,
      shieldBonus,
      dexModifier,
      sizeModifier,
      naturalArmor,
      deflectionBonus,
      miscBonus,
      total,
      touchAC,
      flatFootedAC,
    };
  }

  /**
   * Calculate total weight of all equipment.
   */
  calculateTotalWeight(character: Character): number {
    return character.equipment.reduce((total, e) => total + e.weight, 0);
  }

  /**
   * Get carrying capacity based on STR score.
   *
   * D&D 3.5 CARRYING CAPACITY (Medium size, approximate):
   *   Light Load:  ≤ STR × 3.33
   *   Medium Load: ≤ STR × 6.66
   *   Heavy Load:  ≤ STR × 10
   *
   * This is a simplified approximation. For exact values, use the PHB table.
   */
  getCarryingCapacity(character: Character): { light: number; medium: number; heavy: number } {
    const strScore = this.attributeService.getEffectiveAttribute(character, 'strength');
    return {
      light: Math.floor(strScore * 3.33),
      medium: Math.floor(strScore * 6.66),
      heavy: strScore * 10,
    };
  }

  /**
   * Get all equipped weapons.
   */
  getEquippedWeapons(character: Character): Equipment[] {
    return character.equipment.filter(e => e.type === 'weapon' && e.equipped);
  }
}
