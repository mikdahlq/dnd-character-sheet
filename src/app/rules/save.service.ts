import { Injectable } from '@angular/core';
import { Character } from '../shared/models/character.model';
import { AttributeService } from './attribute.service';
import { EffectService } from './effect.service';
import { DiceService } from './dice.service';

export interface SaveResult {
  total: number;
  naturalRoll: number;
  baseSave: number;
  abilityModifier: number;
  effectBonuses: number;
}

/**
 * SaveService - Handles all saving throw calculations per D&D 3.5 rules.
 *
 * D&D 3.5 SAVING THROW FORMULA:
 *   Save = 1d20 + Base Save + Ability Modifier + Magic Modifier + Misc Modifier
 *
 * SAVE TYPES AND LINKED ATTRIBUTES:
 *   Fortitude (Seghet)   = Base + CON modifier + effects
 *   Reflex (Reflex)      = Base + DEX modifier + effects
 *   Will (Vilja)         = Base + WIS modifier + effects
 *
 * BASE SAVE PROGRESSION (per class):
 *   Good save: 2 + (level / 2)   → e.g., Fighter Fortitude
 *   Poor save: level / 3          → e.g., Fighter Reflex/Will
 *
 * To add a new saving throw type:
 *   1. Add a new base value to the SavingThrows interface
 *   2. Create a new calculate method following the pattern below
 *   3. Add it to calculateAllSaves()
 */
@Injectable({ providedIn: 'root' })
export class SaveService {

  constructor(
    private attributeService: AttributeService,
    private effectService: EffectService,
    private diceService: DiceService,
  ) {}

  /**
   * Calculate Fortitude saving throw bonus (without rolling).
   *
   * FORMULA: baseFortitude + CON modifier + effect bonuses
   */
  calculateFortitudeSave(character: Character): number {
    const baseSave = character.savingThrows.fortitudeBase;
    const conModifier = this.attributeService.getEffectiveModifier(character, 'constitution');
    const effectBonus = this.effectService.getTotalModifier(character.activeEffects, 'fortitude');
    return baseSave + conModifier + effectBonus;
  }

  /**
   * Calculate Reflex saving throw bonus (without rolling).
   *
   * FORMULA: baseReflex + DEX modifier + effect bonuses
   */
  calculateReflexSave(character: Character): number {
    const baseSave = character.savingThrows.reflexBase;
    const dexModifier = this.attributeService.getEffectiveModifier(character, 'dexterity');
    const effectBonus = this.effectService.getTotalModifier(character.activeEffects, 'reflex');
    return baseSave + dexModifier + effectBonus;
  }

  /**
   * Calculate Will saving throw bonus (without rolling).
   *
   * FORMULA: baseWill + WIS modifier + effect bonuses
   */
  calculateWillSave(character: Character): number {
    const baseSave = character.savingThrows.willBase;
    const wisModifier = this.attributeService.getEffectiveModifier(character, 'wisdom');
    const effectBonus = this.effectService.getTotalModifier(character.activeEffects, 'will');
    return baseSave + wisModifier + effectBonus;
  }

  /**
   * Get all saving throw bonuses at once.
   */
  calculateAllSaves(character: Character): { fortitude: number; reflex: number; will: number } {
    return {
      fortitude: this.calculateFortitudeSave(character),
      reflex: this.calculateReflexSave(character),
      will: this.calculateWillSave(character),
    };
  }

  /**
   * Roll a Fortitude saving throw.
   *
   * FORMULA: 1d20 + fortitude save bonus
   */
  rollFortitudeSave(character: Character): SaveResult {
    return this.rollSave(character, 'fortitude');
  }

  /**
   * Roll a Reflex saving throw.
   *
   * FORMULA: 1d20 + reflex save bonus
   */
  rollReflexSave(character: Character): SaveResult {
    return this.rollSave(character, 'reflex');
  }

  /**
   * Roll a Will saving throw.
   *
   * FORMULA: 1d20 + will save bonus
   */
  rollWillSave(character: Character): SaveResult {
    return this.rollSave(character, 'will');
  }

  /**
   * Generic save roll method.
   */
  private rollSave(character: Character, saveType: 'fortitude' | 'reflex' | 'will'): SaveResult {
    const naturalRoll = this.diceService.rollD20();

    let baseSave: number;
    let abilityModifier: number;

    switch (saveType) {
      case 'fortitude':
        baseSave = character.savingThrows.fortitudeBase;
        abilityModifier = this.attributeService.getEffectiveModifier(character, 'constitution');
        break;
      case 'reflex':
        baseSave = character.savingThrows.reflexBase;
        abilityModifier = this.attributeService.getEffectiveModifier(character, 'dexterity');
        break;
      case 'will':
        baseSave = character.savingThrows.willBase;
        abilityModifier = this.attributeService.getEffectiveModifier(character, 'wisdom');
        break;
    }

    const effectBonuses = this.effectService.getTotalModifier(character.activeEffects, saveType);

    return {
      total: naturalRoll + baseSave + abilityModifier + effectBonuses,
      naturalRoll,
      baseSave,
      abilityModifier,
      effectBonuses,
    };
  }
}
