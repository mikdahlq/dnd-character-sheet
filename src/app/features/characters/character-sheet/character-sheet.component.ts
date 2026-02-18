import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CharacterService } from '../../../core/services/character.service';
import { Character, Attributes, Equipment } from '../../../shared/models/character.model';
import { AttackService, AttackResult } from '../../../rules/attack.service';
import { SaveService, SaveResult } from '../../../rules/save.service';
import { AttributeService } from '../../../rules/attribute.service';
import { EquipmentService, ACBreakdown } from '../../../rules/equipment.service';
import { SkillService } from '../../../rules/skill.service';
import { DiceService } from '../../../rules/dice.service';

@Component({
  selector: 'app-character-sheet',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatDividerModule, MatExpansionModule,
    MatTableModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule,
  ],
  template: `
    @if (loading) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (character) {
      <div class="page-header">
        <h1>{{ character.name }}</h1>
        <div>
          <button mat-button routerLink="/characters">
            <mat-icon>arrow_back</mat-icon> Tillbaka
          </button>
          <button mat-button [routerLink]="['/characters', character.id, 'edit']">
            <mat-icon>edit</mat-icon> Redigera
          </button>
        </div>
      </div>

      <div class="sheet-header">
        <mat-chip>{{ character.race }}</mat-chip>
        <mat-chip>{{ character.characterClass }}</mat-chip>
        <mat-chip>Niv\u00e5 {{ character.level }}</mat-chip>
        <mat-chip>{{ character.alignment }}</mat-chip>
        @if (character.deity) { <mat-chip>{{ character.deity }}</mat-chip> }
      </div>

      <div class="grid-3 section">
        <!-- Attributes -->
        <mat-card>
          <mat-card-header><mat-card-title>Attribut</mat-card-title></mat-card-header>
          <mat-card-content>
            @for (attr of attributeKeys; track attr) {
              <div class="attr-row">
                <span class="attr-label">{{ attributeLabels[attr] }}</span>
                <span class="attr-value">{{ character.attributes[attr] }}</span>
                <span class="attr-mod" [class.positive]="getModifier(attr) >= 0" [class.negative]="getModifier(attr) < 0">
                  {{ getModifier(attr) >= 0 ? '+' : '' }}{{ getModifier(attr) }}
                </span>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Combat Stats -->
        <mat-card>
          <mat-card-header><mat-card-title>Strid</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="combat-stat">
              <span>HP</span>
              <span class="hp-value" [class.wounded]="character.currentHitPoints < character.hitPoints / 2">
                {{ character.currentHitPoints }} / {{ character.hitPoints }}
              </span>
            </div>
            <mat-divider></mat-divider>
            <div class="combat-stat">
              <span>BAB</span>
              <span>+{{ character.baseAttackBonus }}</span>
            </div>
            <div class="combat-stat">
              <span>Iterativa attacker</span>
              <span>{{ getIterativeAttacks() }}</span>
            </div>
            <mat-divider></mat-divider>
            <div class="combat-stat">
              <span>Hastighet</span>
              <span>{{ character.speed }} ft</span>
            </div>
            <div class="combat-stat">
              <span>Initiativ</span>
              <span>{{ getModifier('dexterity') >= 0 ? '+' : '' }}{{ getModifier('dexterity') }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- AC & Saves -->
        <mat-card>
          <mat-card-header><mat-card-title>F\u00f6rsvar</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="combat-stat highlight">
              <span>AC</span>
              <span class="ac-value">{{ acBreakdown.total }}</span>
            </div>
            <div class="combat-stat sub">
              <span>Touch AC</span>
              <span>{{ acBreakdown.touchAC }}</span>
            </div>
            <div class="combat-stat sub">
              <span>Flat-Footed AC</span>
              <span>{{ acBreakdown.flatFootedAC }}</span>
            </div>
            <mat-divider></mat-divider>
            <h4>R\u00e4ddningskast</h4>
            <div class="combat-stat">
              <span>Fortitude</span>
              <span>
                {{ saves.fortitude >= 0 ? '+' : '' }}{{ saves.fortitude }}
                <button mat-icon-button (click)="rollSave('fortitude')" matTooltip="Sl\u00e5 Fortitude">
                  <mat-icon>casino</mat-icon>
                </button>
              </span>
            </div>
            <div class="combat-stat">
              <span>Reflex</span>
              <span>
                {{ saves.reflex >= 0 ? '+' : '' }}{{ saves.reflex }}
                <button mat-icon-button (click)="rollSave('reflex')" matTooltip="Sl\u00e5 Reflex">
                  <mat-icon>casino</mat-icon>
                </button>
              </span>
            </div>
            <div class="combat-stat">
              <span>Will</span>
              <span>
                {{ saves.will >= 0 ? '+' : '' }}{{ saves.will }}
                <button mat-icon-button (click)="rollSave('will')" matTooltip="Sl\u00e5 Will">
                  <mat-icon>casino</mat-icon>
                </button>
              </span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Weapons -->
      @if (equippedWeapons.length > 0) {
        <h2 class="section-title">Vapen</h2>
        <div class="grid-2 section">
          @for (weapon of equippedWeapons; track weapon.id) {
            <mat-card class="weapon-card">
              <mat-card-header>
                <mat-card-title>{{ weapon.name }}</mat-card-title>
                <mat-card-subtitle>{{ weapon.weaponType === 'ranged' ? 'Avst\u00e5nd' : 'N\u00e4rstrid' }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="combat-stat">
                  <span>Attack</span>
                  <span>+{{ getAttackBonus(weapon) }}</span>
                </div>
                <div class="combat-stat">
                  <span>Skada</span>
                  <span>{{ weapon.damage || '1d4' }}{{ (weapon.enhancementBonus ?? 0) > 0 ? '+' + weapon.enhancementBonus : '' }}</span>
                </div>
                <div class="combat-stat">
                  <span>Kritisk</span>
                  <span>{{ weapon.criticalRange || '20' }} / x{{ weapon.criticalMultiplier || 2 }}</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary" (click)="rollAttack(weapon)">
                  <mat-icon>casino</mat-icon> Sl\u00e5 attack
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }

      <!-- Skills -->
      @if (character.skills.length > 0) {
        <h2 class="section-title">F\u00e4rdigheter</h2>
        <mat-card class="section">
          <mat-card-content>
            <div class="skills-grid">
              @for (skill of character.skills; track skill.name) {
                @if (skill.ranks > 0 || skill.isClassSkill) {
                  <div class="skill-display">
                    <span class="skill-name">{{ skill.name }}</span>
                    <span class="skill-total">
                      {{ getSkillModifier(skill) >= 0 ? '+' : '' }}{{ getSkillModifier(skill) }}
                      <button mat-icon-button (click)="rollSkill(skill)" matTooltip="Sl\u00e5 {{ skill.name }}">
                        <mat-icon>casino</mat-icon>
                      </button>
                    </span>
                  </div>
                }
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <!-- Spells -->
      @if (character.spells.length > 0) {
        <h2 class="section-title">Trollformler</h2>
        <div class="section">
          @for (spell of character.spells; track spell.name) {
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>{{ spell.name }}</mat-panel-title>
                <mat-panel-description>
                  Niv\u00e5 {{ spell.level }} | {{ spell.school }} | {{ spell.prepared - spell.used }}/{{ spell.prepared }} kvar
                </mat-panel-description>
              </mat-expansion-panel-header>
              <p><strong>R\u00e4ckvidd:</strong> {{ spell.range }}</p>
              <p><strong>Varaktighet:</strong> {{ spell.duration }}</p>
              <p><strong>R\u00e4ddningskast:</strong> {{ spell.savingThrow }}</p>
              <p><strong>Komponenter:</strong> {{ spell.components }}</p>
              <p>{{ spell.description }}</p>
            </mat-expansion-panel>
          }
        </div>
      }

      <!-- Active Effects -->
      @if (character.activeEffects.length > 0) {
        <h2 class="section-title">Aktiva effekter</h2>
        <div class="section">
          @for (effect of character.activeEffects; track effect.id) {
            <mat-card [class.inactive]="!effect.active">
              <mat-card-header>
                <mat-card-title>{{ effect.name }}</mat-card-title>
                <mat-card-subtitle>{{ effect.source }} | {{ effect.duration }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                @for (mod of effect.modifiers; track mod.target) {
                  <mat-chip>{{ mod.target }}: {{ mod.value >= 0 ? '+' : '' }}{{ mod.value }} ({{ mod.bonusType }})</mat-chip>
                }
              </mat-card-content>
            </mat-card>
          }
        </div>
      }

      <!-- Dice Roll Result -->
      @if (lastRollResult) {
        <div class="roll-result" [class.critical]="lastRollResult.includes('KRITISK')">
          <mat-icon>casino</mat-icon>
          <span>{{ lastRollResult }}</span>
        </div>
      }
    }
  `,
  styles: [`
    .sheet-header { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
    .section { margin-bottom: 24px; }
    .attr-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0; border-bottom: 1px solid #eee;
    }
    .attr-label { font-weight: 500; flex: 1; }
    .attr-value { font-size: 1.2rem; margin-right: 16px; }
    .attr-mod { font-size: 1.1rem; font-weight: bold; min-width: 40px; text-align: right; }
    .positive { color: #2e7d32; }
    .negative { color: #c62828; }
    .combat-stat {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 0;
    }
    .combat-stat.highlight { font-size: 1.3rem; font-weight: bold; }
    .combat-stat.sub { font-size: 0.9rem; color: #666; padding: 4px 0; }
    .ac-value { color: #1565c0; font-size: 1.5rem; }
    .hp-value { font-weight: bold; }
    .hp-value.wounded { color: #c62828; }
    .weapon-card { border-left: 4px solid #3f51b5; }
    .skills-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; }
    .skill-display {
      display: flex; justify-content: space-between; align-items: center;
      padding: 4px 8px; border-radius: 4px;
    }
    .skill-display:hover { background: #f5f5f5; }
    .skill-total { font-weight: bold; white-space: nowrap; }
    .inactive { opacity: 0.5; }
    .roll-result {
      position: fixed; bottom: 24px; right: 24px; background: #3f51b5; color: white;
      padding: 16px 24px; border-radius: 8px; display: flex; align-items: center; gap: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-size: 1.1rem; z-index: 1000;
      animation: slideIn 0.3s ease-out;
    }
    .roll-result.critical { background: #d32f2f; }
    @keyframes slideIn {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .loading { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class CharacterSheetComponent implements OnInit {
  private characterService = inject(CharacterService);
  private attackService = inject(AttackService);
  private saveService = inject(SaveService);
  private attributeService = inject(AttributeService);
  private equipmentService = inject(EquipmentService);
  private skillService = inject(SkillService);
  private diceService = inject(DiceService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  character: Character | null = null;
  loading = true;
  lastRollResult: string | null = null;

  acBreakdown: ACBreakdown = { base: 10, armorBonus: 0, shieldBonus: 0, dexModifier: 0, sizeModifier: 0, naturalArmor: 0, deflectionBonus: 0, miscBonus: 0, total: 10, touchAC: 10, flatFootedAC: 10 };
  saves = { fortitude: 0, reflex: 0, will: 0 };
  equippedWeapons: Equipment[] = [];

  attributeKeys: (keyof Attributes)[] = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
  attributeLabels: Record<keyof Attributes, string> = {
    strength: 'Styrka', dexterity: 'Smidighet', constitution: 'Konstitution',
    intelligence: 'Intelligens', wisdom: 'Visdom', charisma: 'Karisma',
  };

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.character = await this.characterService.getCharacter(id);
      if (this.character) {
        this.acBreakdown = this.equipmentService.calculateAC(this.character);
        this.saves = this.saveService.calculateAllSaves(this.character);
        this.equippedWeapons = this.equipmentService.getEquippedWeapons(this.character);
      }
    }
    this.loading = false;
  }

  getModifier(attr: keyof Attributes): number {
    if (!this.character) return 0;
    return this.attributeService.getEffectiveModifier(this.character, attr);
  }

  getAttackBonus(weapon: Equipment): number {
    if (!this.character) return 0;
    return this.attackService.calculateAttackBonus(this.character, weapon);
  }

  getIterativeAttacks(): string {
    if (!this.character) return '';
    return this.attackService.getIterativeAttacks(this.character).map(a => `+${a}`).join(' / ');
  }

  getSkillModifier(skill: any): number {
    if (!this.character) return 0;
    return this.skillService.calculateSkillModifier(this.character, skill);
  }

  rollAttack(weapon: Equipment): void {
    if (!this.character) return;
    const result = this.attackService.rollAttack(this.character, weapon);
    const critText = result.isCriticalThreat ? ' KRITISK TR\u00c4FF!' : '';
    this.showRoll(`${weapon.name}: Attack ${result.attackRoll} (${result.naturalRoll} + ${result.totalAttackBonus}), Skada: ${result.damageRoll}${critText}`);
  }

  rollSave(type: 'fortitude' | 'reflex' | 'will'): void {
    if (!this.character) return;
    let result: SaveResult;
    switch (type) {
      case 'fortitude': result = this.saveService.rollFortitudeSave(this.character); break;
      case 'reflex': result = this.saveService.rollReflexSave(this.character); break;
      case 'will': result = this.saveService.rollWillSave(this.character); break;
    }
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    this.showRoll(`${name}: ${result.total} (${result.naturalRoll} + ${result.baseSave} + ${result.abilityModifier} + ${result.effectBonuses})`);
  }

  rollSkill(skill: any): void {
    if (!this.character) return;
    const result = this.skillService.rollSkillCheck(this.character, skill);
    this.showRoll(`${skill.name}: ${result.total} (${result.naturalRoll} + modifierare)`);
  }

  private showRoll(text: string): void {
    this.lastRollResult = text;
    setTimeout(() => { this.lastRollResult = null; }, 5000);
  }
}
