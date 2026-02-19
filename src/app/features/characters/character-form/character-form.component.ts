import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { CharacterService } from '../../../core/services/character.service';
import { Character, Attributes, Equipment, Spell, Skill, createDefaultCharacter } from '../../../shared/models/character.model';
import { SkillService } from '../../../rules/skill.service';
import { AttributeService } from '../../../rules/attribute.service';

@Component({
  selector: 'app-character-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatTabsModule, MatCheckboxModule, MatSnackBarModule,
    MatChipsModule, MatExpansionModule,
  ],
  template: `
    <div class="page-header">
      <h1>{{ isEditing ? 'Redigera Karaktär' : 'Ny Karaktär' }}</h1>
      <div>
        <button mat-button routerLink="/characters">
          <mat-icon>arrow_back</mat-icon> Tillbaka
        </button>
        <button mat-raised-button color="primary" (click)="save()">
          <mat-icon>save</mat-icon> Spara
        </button>
      </div>
    </div>

    <mat-tab-group>
      <!-- Basic Info Tab -->
      <mat-tab label="Grundinfo">
        <div class="tab-content">
          <mat-card>
            <mat-card-content>
              <div class="grid-2">
                <mat-form-field class="full-width">
                  <mat-label>Namn</mat-label>
                  <input matInput [(ngModel)]="character.name" placeholder="Karaktärens namn">
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Ras</mat-label>
                  <mat-select [(ngModel)]="character.race">
                    @for (race of races; track race) {
                      <mat-option [value]="race">{{ race }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Klass</mat-label>
                  <mat-select [(ngModel)]="character.characterClass">
                    @for (cls of classes; track cls) {
                      <mat-option [value]="cls">{{ cls }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Nivå</mat-label>
                  <input matInput type="number" [(ngModel)]="character.level" min="1" max="20">
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Sinnelag</mat-label>
                  <mat-select [(ngModel)]="character.alignment">
                    @for (a of alignments; track a) {
                      <mat-option [value]="a">{{ a }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Gudomlighet</mat-label>
                  <input matInput [(ngModel)]="character.deity">
                </mat-form-field>
              </div>
              <mat-form-field class="full-width">
                <mat-label>Bakgrundsbeskrivning</mat-label>
                <textarea matInput [(ngModel)]="character.background" rows="4"
                  placeholder="Beskriv din karaktärs bakgrund..."></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- Attributes Tab -->
      <mat-tab label="Attribut">
        <div class="tab-content">
          <mat-card>
            <mat-card-content>
              <h3 class="section-title">Attribut</h3>
              <div class="grid-3">
                @for (attr of attributeKeys; track attr) {
                  <div class="attribute-box">
                    <mat-form-field class="full-width">
                      <mat-label>{{ attributeLabels[attr] }}</mat-label>
                      <input matInput type="number" [(ngModel)]="character.attributes[attr]" min="1" max="30">
                    </mat-form-field>
                    <div class="modifier">
                      Mod: {{ attributeService.calculateModifier(character.attributes[attr]) >= 0 ? '+' : '' }}{{ attributeService.calculateModifier(character.attributes[attr]) }}
                    </div>
                  </div>
                }
              </div>
              <h3 class="section-title">Strid</h3>
              <div class="grid-3">
                <mat-form-field class="full-width">
                  <mat-label>HP</mat-label>
                  <input matInput type="number" [(ngModel)]="character.hitPoints">
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Nuvarande HP</mat-label>
                  <input matInput type="number" [(ngModel)]="character.currentHitPoints">
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Base Attack Bonus</mat-label>
                  <input matInput type="number" [(ngModel)]="character.baseAttackBonus">
                </mat-form-field>
              </div>
              <h3 class="section-title">Räddningskast (Saves)</h3>
              <div class="grid-3">
                <mat-form-field class="full-width">
                  <mat-label>Fortitude (bas)</mat-label>
                  <input matInput type="number" [(ngModel)]="character.savingThrows.fortitudeBase">
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Reflex (bas)</mat-label>
                  <input matInput type="number" [(ngModel)]="character.savingThrows.reflexBase">
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Will (bas)</mat-label>
                  <input matInput type="number" [(ngModel)]="character.savingThrows.willBase">
                </mat-form-field>
              </div>
              <h3 class="section-title">Övrigt</h3>
              <div class="grid-3">
                <mat-form-field class="full-width">
                  <mat-label>Hastighet (ft)</mat-label>
                  <input matInput type="number" [(ngModel)]="character.speed">
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Storlek</mat-label>
                  <mat-select [(ngModel)]="character.size">
                    @for (s of sizes; track s) {
                      <mat-option [value]="s">{{ s }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field class="full-width">
                  <mat-label>Naturlig rustning</mat-label>
                  <input matInput type="number" [(ngModel)]="character.naturalArmor">
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- Skills Tab -->
      <mat-tab label="Färdigheter">
        <div class="tab-content">
          <mat-card>
            <mat-card-content>
              <div class="skills-header">
                <h3 class="section-title">Färdigheter</h3>
                <button mat-button color="primary" (click)="addDefaultSkills()">
                  <mat-icon>playlist_add</mat-icon> Lägg till standardfärdigheter
                </button>
              </div>
              @for (skill of character.skills; track skill.name; let i = $index) {
                <div class="skill-row">
                  <span class="skill-name">{{ skill.name }}</span>
                  <mat-checkbox [(ngModel)]="skill.isClassSkill">Klassfärdighet</mat-checkbox>
                  <mat-form-field class="small-field">
                    <mat-label>Rang</mat-label>
                    <input matInput type="number" [(ngModel)]="skill.ranks" min="0">
                  </mat-form-field>
                  <mat-form-field class="small-field">
                    <mat-label>Övr. mod</mat-label>
                    <input matInput type="number" [(ngModel)]="skill.miscModifier">
                  </mat-form-field>
                  <span class="skill-attr">({{ skill.attributeKey.substring(0, 3).toUpperCase() }})</span>
                  <button mat-icon-button color="warn" (click)="removeSkill(i)">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- Equipment Tab -->
      <mat-tab label="Utrustning">
        <div class="tab-content">
          <mat-card>
            <mat-card-content>
              <div class="skills-header">
                <h3 class="section-title">Utrustning</h3>
                <button mat-raised-button color="primary" (click)="addEquipment()">
                  <mat-icon>add</mat-icon> Lägg till
                </button>
              </div>
              @for (item of character.equipment; track item.id; let i = $index) {
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>
                      {{ item.name || 'Nytt föremål' }}
                      @if (item.equipped) { <mat-icon class="equipped-icon">check_circle</mat-icon> }
                    </mat-panel-title>
                    <mat-panel-description>{{ item.type }}</mat-panel-description>
                  </mat-expansion-panel-header>
                  <div class="grid-2">
                    <mat-form-field class="full-width">
                      <mat-label>Namn</mat-label>
                      <input matInput [(ngModel)]="item.name">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Typ</mat-label>
                      <mat-select [(ngModel)]="item.type">
                        <mat-option value="weapon">Vapen</mat-option>
                        <mat-option value="armor">Rustning</mat-option>
                        <mat-option value="shield">Sköld</mat-option>
                        <mat-option value="item">Föremål</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Beskrivning</mat-label>
                      <input matInput [(ngModel)]="item.description">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Vikt (lbs)</mat-label>
                      <input matInput type="number" [(ngModel)]="item.weight">
                    </mat-form-field>
                    <mat-checkbox [(ngModel)]="item.equipped">Utrustad</mat-checkbox>
                  </div>
                  @if (item.type === 'weapon') {
                    <h4>Vapenstatistik</h4>
                    <div class="grid-3">
                      <mat-form-field class="full-width">
                        <mat-label>Skada (t.ex. 1d8)</mat-label>
                        <input matInput [(ngModel)]="item.damage">
                      </mat-form-field>
                      <mat-form-field class="full-width">
                        <mat-label>Kritisk (t.ex. 19-20)</mat-label>
                        <input matInput [(ngModel)]="item.criticalRange">
                      </mat-form-field>
                      <mat-form-field class="full-width">
                        <mat-label>Krit. multiplikator</mat-label>
                        <input matInput type="number" [(ngModel)]="item.criticalMultiplier">
                      </mat-form-field>
                      <mat-form-field class="full-width">
                        <mat-label>Vapentyp</mat-label>
                        <mat-select [(ngModel)]="item.weaponType">
                          <mat-option value="melee">Närstrid</mat-option>
                          <mat-option value="ranged">Avstånd</mat-option>
                        </mat-select>
                      </mat-form-field>
                      <mat-form-field class="full-width">
                        <mat-label>Förbättringsbonus</mat-label>
                        <input matInput type="number" [(ngModel)]="item.enhancementBonus">
                      </mat-form-field>
                    </div>
                  }
                  @if (item.type === 'armor') {
                    <h4>Rustningsstatistik</h4>
                    <div class="grid-3">
                      <mat-form-field class="full-width">
                        <mat-label>Rustningsbonus</mat-label>
                        <input matInput type="number" [(ngModel)]="item.armorBonus">
                      </mat-form-field>
                      <mat-form-field class="full-width">
                        <mat-label>Max DEX-bonus</mat-label>
                        <input matInput type="number" [(ngModel)]="item.maxDexBonus">
                      </mat-form-field>
                      <mat-form-field class="full-width">
                        <mat-label>Rustningsstraff</mat-label>
                        <input matInput type="number" [(ngModel)]="item.armorCheckPenalty">
                      </mat-form-field>
                    </div>
                  }
                  @if (item.type === 'shield') {
                    <h4>Sköldstatistik</h4>
                    <div class="grid-2">
                      <mat-form-field class="full-width">
                        <mat-label>Sköldbonus</mat-label>
                        <input matInput type="number" [(ngModel)]="item.shieldBonus">
                      </mat-form-field>
                      <mat-form-field class="full-width">
                        <mat-label>Rustningsstraff</mat-label>
                        <input matInput type="number" [(ngModel)]="item.armorCheckPenalty">
                      </mat-form-field>
                    </div>
                  }
                  <div class="panel-actions">
                    <button mat-button color="warn" (click)="removeEquipment(i)">
                      <mat-icon>delete</mat-icon> Ta bort
                    </button>
                  </div>
                </mat-expansion-panel>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- Spells Tab -->
      <mat-tab label="Magi">
        <div class="tab-content">
          <mat-card>
            <mat-card-content>
              <div class="skills-header">
                <h3 class="section-title">Trollformler</h3>
                <button mat-raised-button color="primary" (click)="addSpell()">
                  <mat-icon>add</mat-icon> Lägg till
                </button>
              </div>
              @for (spell of character.spells; track spell.name; let i = $index) {
                <mat-expansion-panel>
                  <mat-expansion-panel-header>
                    <mat-panel-title>{{ spell.name || 'Ny trollformel' }}</mat-panel-title>
                    <mat-panel-description>Nivå {{ spell.level }} - {{ spell.school }}</mat-panel-description>
                  </mat-expansion-panel-header>
                  <div class="grid-2">
                    <mat-form-field class="full-width">
                      <mat-label>Namn</mat-label>
                      <input matInput [(ngModel)]="spell.name">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Nivå</mat-label>
                      <input matInput type="number" [(ngModel)]="spell.level" min="0" max="9">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Skola</mat-label>
                      <mat-select [(ngModel)]="spell.school">
                        @for (school of spellSchools; track school) {
                          <mat-option [value]="school">{{ school }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Besvärjande attribut</mat-label>
                      <mat-select [(ngModel)]="spell.castingAttribute">
                        <mat-option value="intelligence">Intelligens</mat-option>
                        <mat-option value="wisdom">Visdom</mat-option>
                        <mat-option value="charisma">Karisma</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Räckvidd</mat-label>
                      <input matInput [(ngModel)]="spell.range">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Varaktighet</mat-label>
                      <input matInput [(ngModel)]="spell.duration">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Räddningskast</mat-label>
                      <input matInput [(ngModel)]="spell.savingThrow">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Komponenter</mat-label>
                      <input matInput [(ngModel)]="spell.components">
                    </mat-form-field>
                  </div>
                  <mat-form-field class="full-width">
                    <mat-label>Beskrivning</mat-label>
                    <textarea matInput [(ngModel)]="spell.description" rows="3"></textarea>
                  </mat-form-field>
                  <div class="grid-2">
                    <mat-form-field class="full-width">
                      <mat-label>Preparerade</mat-label>
                      <input matInput type="number" [(ngModel)]="spell.prepared" min="0">
                    </mat-form-field>
                    <mat-form-field class="full-width">
                      <mat-label>Använda</mat-label>
                      <input matInput type="number" [(ngModel)]="spell.used" min="0">
                    </mat-form-field>
                  </div>
                  <div class="panel-actions">
                    <button mat-button color="warn" (click)="removeSpell(i)">
                      <mat-icon>delete</mat-icon> Ta bort
                    </button>
                  </div>
                </mat-expansion-panel>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>

      <!-- Notes Tab -->
      <mat-tab label="Anteckningar">
        <div class="tab-content">
          <mat-card>
            <mat-card-content>
              <mat-form-field class="full-width">
                <mat-label>Anteckningar</mat-label>
                <textarea matInput [(ngModel)]="character.notes" rows="12"
                  placeholder="Fria anteckningar om din karaktär..."></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
    .attribute-box { text-align: center; }
    .modifier {
      font-size: 1.2rem;
      font-weight: bold;
      color: #3f51b5;
      margin-top: -8px;
      margin-bottom: 8px;
    }
    .skills-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .skill-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 4px 0;
      border-bottom: 1px solid #eee;
    }
    .skill-name { min-width: 160px; font-weight: 500; }
    .skill-attr { color: #666; font-size: 0.85rem; }
    .small-field { width: 80px; }
    .equipped-icon { color: #4caf50; font-size: 18px; margin-left: 8px; }
    .panel-actions { text-align: right; padding-top: 8px; }
  `]
})
export class CharacterFormComponent implements OnInit {
  private characterService = inject(CharacterService);
  private skillService = inject(SkillService);
  attributeService = inject(AttributeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  character: Character = createDefaultCharacter('');
  isEditing = false;

  attributeKeys: (keyof Attributes)[] = [
    'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'
  ];
  attributeLabels: Record<keyof Attributes, string> = {
    strength: 'Styrka (STR)',
    dexterity: 'Smidighet (DEX)',
    constitution: 'Konstitution (CON)',
    intelligence: 'Intelligens (INT)',
    wisdom: 'Visdom (WIS)',
    charisma: 'Karisma (CHA)',
  };

  races = ['Människa', 'Alv', 'Dvärg', 'Halvling', 'Halvalv', 'Halvork', 'Gnome'];
  classes = ['Krigare', 'Magiker', 'Tjuv', 'Präst', 'Barbar', 'Bard', 'Druid', 'Munk', 'Paladin', 'Ranger', 'Trollkarl'];
  alignments = [
    'Lawful Good', 'Neutral Good', 'Chaotic Good',
    'Lawful Neutral', 'Neutral', 'Chaotic Neutral',
    'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'
  ];
  sizes: Character['size'][] = ['fine', 'diminutive', 'tiny', 'small', 'medium', 'large', 'huge', 'gargantuan', 'colossal'];
  spellSchools = ['Abjuration', 'Conjuration', 'Divination', 'Enchantment', 'Evocation', 'Illusion', 'Necromancy', 'Transmutation', 'Universal'];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditing = true;
      const char = await this.characterService.getCharacter(id);
      if (char) {
        this.character = char;
      }
    }
  }

  async save(): Promise<void> {
    try {
      if (this.isEditing && this.character.id) {
        await this.characterService.updateCharacter(this.character.id, this.character);
        this.snackBar.open('Karaktären har sparats', 'OK', { duration: 3000 });
      } else {
        const id = await this.characterService.createCharacter(this.character);
        this.snackBar.open('Karaktären har skapats', 'OK', { duration: 3000 });
        this.router.navigate(['/characters', id, 'edit']);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
      this.snackBar.open(`Kunde inte spara: ${message}`, 'OK', { duration: 5000 });
    }
  }

  addDefaultSkills(): void {
    this.character.skills = this.skillService.getDefaultSkills();
  }

  removeSkill(index: number): void {
    this.character.skills.splice(index, 1);
  }

  addEquipment(): void {
    this.character.equipment.push({
      id: crypto.randomUUID(),
      name: '', type: 'item', description: '', weight: 0, equipped: false,
    });
  }

  removeEquipment(index: number): void {
    this.character.equipment.splice(index, 1);
  }

  addSpell(): void {
    this.character.spells.push({
      name: '', level: 0, school: 'Evocation', castingAttribute: 'intelligence',
      description: '', range: '', duration: '', savingThrow: '', components: '',
      prepared: 0, used: 0,
    });
  }

  removeSpell(index: number): void {
    this.character.spells.splice(index, 1);
  }
}
