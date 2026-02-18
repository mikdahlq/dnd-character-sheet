import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { SessionService } from '../../../core/services/session.service';
import { CharacterService } from '../../../core/services/character.service';
import { AuthService } from '../../../core/services/auth.service';
import { GameSession } from '../../../shared/models/session.model';
import { Character, createDefaultCharacter } from '../../../shared/models/character.model';

@Component({
  selector: 'app-session-view',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatSelectModule, MatFormFieldModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    @if (loading) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (session) {
      <div class="page-header">
        <div>
          <h1>{{ session.name }}</h1>
          <p class="subtitle">{{ session.description }}</p>
        </div>
        <button mat-button routerLink="/sessions"><mat-icon>arrow_back</mat-icon> Tillbaka</button>
      </div>

      <div class="session-meta">
        <mat-chip>{{ session.status }}</mat-chip>
        <span>Inbjudningskod: <strong>{{ session.inviteCode }}</strong></span>
        <span>Spelare: {{ session.players.length }} / {{ session.maxPlayers }}</span>
      </div>

      <!-- Join Section (if not already in session) -->
      @if (!isInSession) {
        <mat-card class="join-section">
          <mat-card-header><mat-card-title>G\u00e5 med i sessionen</mat-card-title></mat-card-header>
          <mat-card-content>
            <mat-form-field class="full-width">
              <mat-label>Roll</mat-label>
              <mat-select [(ngModel)]="selectedRole">
                <mat-option value="player">Spelare</mat-option>
                <mat-option value="gm">Spelledare</mat-option>
              </mat-select>
            </mat-form-field>
            @if (selectedRole === 'player') {
              <mat-form-field class="full-width">
                <mat-label>V\u00e4lj karakt\u00e4r</mat-label>
                <mat-select [(ngModel)]="selectedCharacterId">
                  <mat-option value="new">Skapa ny sessionskarakt\u00e4r</mat-option>
                  @for (char of myCharacters; track char.id) {
                    <mat-option [value]="char.id">{{ char.name }} ({{ char.characterClass }} Lvl {{ char.level }})</mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
          </mat-card-content>
          <mat-card-actions align="end">
            <button mat-raised-button color="primary" (click)="joinSession()">
              <mat-icon>group_add</mat-icon> G\u00e5 med
            </button>
          </mat-card-actions>
        </mat-card>
      }

      <!-- Players List -->
      <h2 class="section-title">Deltagare</h2>
      @for (player of session.players; track player.userId) {
        <mat-card class="player-card">
          <mat-card-header>
            <mat-card-title>{{ player.displayName }}</mat-card-title>
            <mat-card-subtitle>
              {{ player.role === 'gm' ? 'Spelledare' : 'Spelare' }}
              @if (player.sessionCharacter) {
                - {{ player.sessionCharacter.name }} ({{ player.sessionCharacter.characterClass }} Niv\u00e5 {{ player.sessionCharacter.level }})
              }
            </mat-card-subtitle>
          </mat-card-header>
        </mat-card>
      }
    }
  `,
  styles: [`
    .subtitle { color: #666; margin-top: 4px; }
    .session-meta { display: flex; gap: 16px; align-items: center; margin-bottom: 24px; flex-wrap: wrap; }
    .join-section { margin-bottom: 24px; border-left: 4px solid #ff9800; }
    .player-card { margin-bottom: 8px; }
    .loading { display: flex; justify-content: center; padding: 48px; }
  `]
})
export class SessionViewComponent implements OnInit {
  private sessionService = inject(SessionService);
  private characterService = inject(CharacterService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  session: GameSession | null = null;
  myCharacters: Character[] = [];
  loading = true;
  isInSession = false;
  selectedRole: 'player' | 'gm' = 'player';
  selectedCharacterId: string = 'new';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.session = await this.sessionService.getSession(id);
      this.myCharacters = await this.characterService.getMyCharacters();
      const uid = this.authService.currentUser?.uid;
      this.isInSession = this.session?.players.some(p => p.userId === uid) ?? false;
    }
    this.loading = false;
  }

  async joinSession(): Promise<void> {
    if (!this.session?.inviteCode) return;
    let character: Character | null = null;

    if (this.selectedRole === 'player') {
      if (this.selectedCharacterId === 'new') {
        const uid = this.authService.currentUser?.uid || '';
        character = createDefaultCharacter(uid);
        character.name = 'Ny Sessionskarakt\u00e4r';
      } else {
        const original = this.myCharacters.find(c => c.id === this.selectedCharacterId);
        if (original) {
          character = this.characterService.createSessionCopy(original);
        }
      }
    }

    await this.sessionService.joinSession(this.session.inviteCode, this.selectedRole, character);
    this.snackBar.open('Du har g\u00e5tt med i sessionen!', 'OK', { duration: 3000 });

    // Reload
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.session = await this.sessionService.getSession(id);
      this.isInSession = true;
    }
  }
}
