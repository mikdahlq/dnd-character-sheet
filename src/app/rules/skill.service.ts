import { Injectable } from '@angular/core';
import { Character, Skill, Attributes } from '../shared/models/character.model';
import { AttributeService } from './attribute.service';
import { EffectService } from './effect.service';
import { DiceService } from './dice.service';

export interface SkillCheckResult {
  total: number;
  naturalRoll: number;
  ranks: number;
  abilityModifier: number;
  miscModifier: number;
  classSkillBonus: number;
  effectBonuses: number;
  armorCheckPenalty: number;
}

/**
 * SkillService - Handles all skill check calculations per D&D 3.5 rules.
 *
 * D&D 3.5 SKILL CHECK FORMULA:
 *   Skill Check = 1d20 + Skill Ranks + Ability Modifier + Misc Modifier
 *
 * CLASS SKILL BONUS (D&D 3.5 variant):
 *   Class skills gain +3 bonus if at least 1 rank is invested.
 *
 * ARMOR CHECK PENALTY:
 *   Physical skills (e.g., Climb, Swim) are penalized by armor check penalty.
 */
@Injectable({ providedIn: 'root' })
export class SkillService {

  /** Skills that are subject to armor check penalty */
  private readonly ARMOR_CHECK_SKILLS: Set<string> = new Set([
    'Balance', 'Climb', 'Escape Artist', 'Hide', 'Jump',
    'Move Silently', 'Sleight of Hand', 'Swim', 'Tumble',
  ]);

  constructor(
    private attributeService: AttributeService,
    private effectService: EffectService,
    private diceService: DiceService,
  ) {}

  /**
   * Calculate the total skill modifier (without rolling).
   *
   * FORMULA: ranks + abilityMod + miscMod + classSkillBonus + effectBonus - armorCheckPenalty
   */
  calculateSkillModifier(character: Character, skill: Skill): number {
    const abilityMod = this.attributeService.getEffectiveModifier(character, skill.attributeKey);
    const classSkillBonus = (skill.isClassSkill && skill.ranks > 0) ? 3 : 0;
    const effectBonus = this.effectService.getTotalModifier(character.activeEffects, `skill_${skill.name.toLowerCase()}`);
    const armorPenalty = this.ARMOR_CHECK_SKILLS.has(skill.name) ? this.getArmorCheckPenalty(character) : 0;

    return skill.ranks + abilityMod + skill.miscModifier + classSkillBonus + effectBonus - armorPenalty;
  }

  /**
   * Roll a skill check.
   *
   * FORMULA: 1d20 + skill modifier
   */
  rollSkillCheck(character: Character, skill: Skill): SkillCheckResult {
    const naturalRoll = this.diceService.rollD20();
    const abilityMod = this.attributeService.getEffectiveModifier(character, skill.attributeKey);
    const classSkillBonus = (skill.isClassSkill && skill.ranks > 0) ? 3 : 0;
    const effectBonuses = this.effectService.getTotalModifier(character.activeEffects, `skill_${skill.name.toLowerCase()}`);
    const armorCheckPenalty = this.ARMOR_CHECK_SKILLS.has(skill.name) ? this.getArmorCheckPenalty(character) : 0;

    const total = naturalRoll + skill.ranks + abilityMod + skill.miscModifier
      + classSkillBonus + effectBonuses - armorCheckPenalty;

    return {
      total,
      naturalRoll,
      ranks: skill.ranks,
      abilityModifier: abilityMod,
      miscModifier: skill.miscModifier,
      classSkillBonus,
      effectBonuses,
      armorCheckPenalty,
    };
  }

  /**
   * Get total armor check penalty from equipped armor and shield.
   */
  getArmorCheckPenalty(character: Character): number {
    return character.equipment
      .filter(e => e.equipped && (e.type === 'armor' || e.type === 'shield'))
      .reduce((total, e) => total + (e.armorCheckPenalty ?? 0), 0);
  }

  /**
   * Get the default D&D 3.5 skill list with associated attributes.
   */
  getDefaultSkills(): Skill[] {
    const skills: [string, keyof Attributes][] = [
      ['Appraise', 'intelligence'],
      ['Balance', 'dexterity'],
      ['Bluff', 'charisma'],
      ['Climb', 'strength'],
      ['Concentration', 'constitution'],
      ['Craft', 'intelligence'],
      ['Decipher Script', 'intelligence'],
      ['Diplomacy', 'charisma'],
      ['Disable Device', 'intelligence'],
      ['Disguise', 'charisma'],
      ['Escape Artist', 'dexterity'],
      ['Forgery', 'intelligence'],
      ['Gather Information', 'charisma'],
      ['Handle Animal', 'charisma'],
      ['Heal', 'wisdom'],
      ['Hide', 'dexterity'],
      ['Intimidate', 'charisma'],
      ['Jump', 'strength'],
      ['Knowledge (Arcana)', 'intelligence'],
      ['Knowledge (History)', 'intelligence'],
      ['Knowledge (Nature)', 'intelligence'],
      ['Knowledge (Religion)', 'intelligence'],
      ['Listen', 'wisdom'],
      ['Move Silently', 'dexterity'],
      ['Open Lock', 'dexterity'],
      ['Perform', 'charisma'],
      ['Profession', 'wisdom'],
      ['Ride', 'dexterity'],
      ['Search', 'intelligence'],
      ['Sense Motive', 'wisdom'],
      ['Sleight of Hand', 'dexterity'],
      ['Spellcraft', 'intelligence'],
      ['Spot', 'wisdom'],
      ['Survival', 'wisdom'],
      ['Swim', 'strength'],
      ['Tumble', 'dexterity'],
      ['Use Magic Device', 'charisma'],
      ['Use Rope', 'dexterity'],
    ];

    return skills.map(([name, attr]) => ({
      name,
      attributeKey: attr,
      ranks: 0,
      miscModifier: 0,
      isClassSkill: false,
    }));
  }
}
