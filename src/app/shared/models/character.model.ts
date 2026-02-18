/**
 * D&D 3.5 Character Model
 * All attributes and stats follow the modified D&D 3.5 ruleset.
 */

export interface Attributes {
  /** Styrka - physical power */
  strength: number;
  /** Smidighet - agility and reflexes */
  dexterity: number;
  /** Konstitution - endurance and health */
  constitution: number;
  /** Intelligens - reasoning and knowledge */
  intelligence: number;
  /** Visdom - perception and willpower */
  wisdom: number;
  /** Karisma - force of personality */
  charisma: number;
}

export interface Skill {
  name: string;
  /** Linked attribute key, e.g. 'dexterity' */
  attributeKey: keyof Attributes;
  ranks: number;
  miscModifier: number;
  isClassSkill: boolean;
}

export interface Spell {
  name: string;
  level: number;
  school: string;
  /** Casting attribute, e.g. 'intelligence' for wizards */
  castingAttribute: keyof Attributes;
  description: string;
  range: string;
  duration: string;
  savingThrow: string;
  components: string;
  prepared: number;
  used: number;
}

export interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'shield' | 'item';
  description: string;
  weight: number;
  equipped: boolean;
  /** Weapon-specific */
  damage?: string;
  criticalRange?: string;
  criticalMultiplier?: number;
  weaponType?: 'melee' | 'ranged';
  enhancementBonus?: number;
  /** Armor-specific */
  armorBonus?: number;
  maxDexBonus?: number;
  armorCheckPenalty?: number;
  spellFailure?: number;
  /** Shield-specific */
  shieldBonus?: number;
}

export interface ActiveEffect {
  id: string;
  name: string;
  source: string;
  /** Which stats/attributes this effect modifies */
  modifiers: EffectModifier[];
  duration: string;
  active: boolean;
}

export interface EffectModifier {
  /** The stat this modifier affects, e.g. 'strength', 'ac', 'attack', 'fortitude' */
  target: string;
  /** Bonus type for stacking rules: enhancement, morale, deflection, etc. */
  bonusType: BonusType;
  value: number;
}

export type BonusType =
  | 'enhancement'
  | 'morale'
  | 'deflection'
  | 'natural_armor'
  | 'shield'
  | 'armor'
  | 'dodge'
  | 'size'
  | 'luck'
  | 'sacred'
  | 'profane'
  | 'insight'
  | 'competence'
  | 'circumstance'
  | 'resistance'
  | 'untyped';

export interface SavingThrows {
  fortitudeBase: number;
  reflexBase: number;
  willBase: number;
}

export interface Character {
  id?: string;
  userId: string;
  name: string;
  race: string;
  characterClass: string;
  level: number;
  alignment: string;
  deity: string;
  background: string;
  attributes: Attributes;
  hitPoints: number;
  currentHitPoints: number;
  baseAttackBonus: number;
  savingThrows: SavingThrows;
  skills: Skill[];
  spells: Spell[];
  equipment: Equipment[];
  activeEffects: ActiveEffect[];
  experience: number;
  /** Movement speed in feet */
  speed: number;
  /** Size category */
  size: 'fine' | 'diminutive' | 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan' | 'colossal';
  /** Natural armor bonus */
  naturalArmor: number;
  /** Notes and misc info */
  notes: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Default values for a new level 1 character */
export function createDefaultCharacter(userId: string): Character {
  return {
    userId,
    name: '',
    race: 'Människa',
    characterClass: 'Krigare',
    level: 1,
    alignment: 'Neutral',
    deity: '',
    background: '',
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      charisma: 10,
    },
    hitPoints: 10,
    currentHitPoints: 10,
    baseAttackBonus: 1,
    savingThrows: {
      fortitudeBase: 2,
      reflexBase: 0,
      willBase: 0,
    },
    skills: [],
    spells: [],
    equipment: [],
    activeEffects: [],
    experience: 0,
    speed: 30,
    size: 'medium',
    naturalArmor: 0,
    notes: '',
  };
}
