import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CharacterService } from '../../../core/services/character.service';
import { Character } from '../../../shared/models/character.model';

@Component({
  selector: 'app-character-list',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatDialogModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Mina Karaktärer</h1>
      <button mat-raised-button color="primary" routerLink="/characters/new">
        <mat-icon>add</mat-icon> Ny Karaktär
      </button>
    </div>

    @if (loading) {
      <div class="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
    } @else if (characters.length === 0) {
      <mat-card class="empty-state">
        <mat-card-content>
          <mat-icon class="empty-icon">person_off</mat-icon>
          <p>Du har inga karaktärer ännu.</p>
          <button mat-raised-button color="primary" routerLink="/characters/new">
            Skapa din första karaktär
          </button>
        </mat-card-content>
      </mat-card>
    } @else {
      <div class="character-grid">
        @for (char of characters; track char.id) {
          <mat-card class="character-card">
            <mat-card-header>
              <mat-card-title>{{ char.name || 'Namnlös' }}</mat-card-title>
              <mat-card-subtitle>
                {{ char.race }} {{ char.characterClass }} (Nivå {{ char.level }})
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-chips">
                <mat-chip>STR {{ char.attributes.strength }}</mat-chip>
                <mat-chip>DEX {{ char.attributes.dexterity }}</mat-chip>
                <mat-chip>CON {{ char.attributes.constitution }}</mat-chip>
                <mat-chip>INT {{ char.attributes.intelligence }}</mat-chip>
                <mat-chip>WIS {{ char.attributes.wisdom }}</mat-chip>
                <mat-chip>CHA {{ char.attributes.charisma }}</mat-chip>
              </div>
              <p class="hp-display">HP: {{ char.currentHitPoints }} / {{ char.hitPoints }}</p>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button [routerLink]="['/characters', char.id, 'sheet']">
                <mat-icon>description</mat-icon> Blad
              </button>
              <button mat-button [routerLink]="['/characters', char.id, 'edit']">
                <mat-icon>edit</mat-icon> Redigera
              </button>
              <button mat-button color="warn" (click)="deleteCharacter(char)">
                <mat-icon>delete</mat-icon> Ta bort
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }
    .empty-state {
      text-align: center;
      padding: 48px;
    }
    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #999;
    }
    .character-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }
    .stat-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin: 8px 0;
    }
    .hp-display {
      font-weight: 500;
      color: #d32f2f;
      margin-top: 8px;
    }
  `]
})
export class CharacterListComponent implements OnInit {
  private characterService = inject(CharacterService);
  private snackBar = inject(MatSnackBar);

  characters: Character[] = [];
  loading = true;

  async ngOnInit(): Promise<void> {
    await this.loadCharacters();
  }

  async loadCharacters(): Promise<void> {
    this.loading = true;
    this.characters = await this.characterService.getMyCharacters();
    this.loading = false;
  }

  async deleteCharacter(char: Character): Promise<void> {
    if (!char.id) return;
    if (confirm(`Vill du verkligen ta bort ${char.name}?`)) {
      await this.characterService.deleteCharacter(char.id);
      this.snackBar.open(`${char.name} har tagits bort`, 'OK', { duration: 3000 });
      await this.loadCharacters();
    }
  }
}
