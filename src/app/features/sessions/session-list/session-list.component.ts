import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { SessionService } from '../../../core/services/session.service';
import { GameSession } from '../../../shared/models/session.model';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatCardModule, MatButtonModule,
    MatIconModule, MatChipsModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatDialogModule,
  ],
  template: `
    <div class="page-header">
      <h1>Spelsessioner</h1>
      <div>
        <button mat-raised-button color="primary" routerLink="/sessions/new">
          <mat-icon>add</mat-icon> Ny Session
        </button>
      </div>
    </div>

    <!-- Join by code -->
    <mat-card class="join-card">
      <mat-card-content>
        <div class="join-row">
          <mat-form-field>
            <mat-label>Inbjudningskod</mat-label>
            <input matInput [(ngModel)]="inviteCode" placeholder="T.ex. ABC123" maxlength="6">
          </mat-form-field>
          <button mat-raised-button color="accent" (click)="searchByCode()">
            <mat-icon>search</mat-icon> S\u00f6k
          </button>
        </div>
        @if (foundSession) {
          <div class="found-session">
            <strong>{{ foundSession.name }}</strong> - {{ foundSession.description }}
            <br>Spelare: {{ foundSession.players.length }} / {{ foundSession.maxPlayers }}
            <br>
            <button mat-raised-button color="primary" [routerLink]="['/sessions', foundSession.id]">
              G\u00e5 med
            </button>
          </div>
        }
      </mat-card-content>
    </mat-card>

    @if (loading) {
      <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
    } @else if (sessions.length === 0) {
      <mat-card class="empty-state">
        <mat-card-content>
          <mat-icon class="empty-icon">groups</mat-icon>
          <p>Du har inga aktiva sessioner.</p>
        </mat-card-content>
      </mat-card>
    } @else {
      <div class="session-grid">
        @for (session of sessions; track session.id) {
          <mat-card class="session-card">
            <mat-card-header>
              <mat-card-title>{{ session.name }}</mat-card-title>
              <mat-card-subtitle>{{ session.description }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="session-info">
                <mat-chip>{{ session.status }}</mat-chip>
                <span>Spelare: {{ session.players.length }} / {{ session.maxPlayers }}</span>
              </div>
              <div class="invite-code">
                Inbjudningskod: <strong>{{ session.inviteCode }}</strong>
              </div>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button [routerLink]="['/sessions', session.id]">
                <mat-icon>visibility</mat-icon> Visa
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .join-card { margin-bottom: 24px; }
    .join-row { display: flex; align-items: center; gap: 16px; }
    .found-session { padding: 16px; background: #e8f5e9; border-radius: 8px; margin-top: 8px; }
    .loading { display: flex; justify-content: center; padding: 48px; }
    .empty-state { text-align: center; padding: 48px; }
    .empty-icon { font-size: 64px; width: 64px; height: 64px; color: #999; }
    .session-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
    .session-info { display: flex; align-items: center; gap: 12px; margin: 8px 0; }
    .invite-code { margin-top: 8px; font-size: 0.9rem; color: #666; }
  `]
})
export class SessionListComponent implements OnInit {
  private sessionService = inject(SessionService);
  private snackBar = inject(MatSnackBar);

  sessions: GameSession[] = [];
  loading = true;
  inviteCode = '';
  foundSession: GameSession | null = null;

  async ngOnInit(): Promise<void> {
    this.loading = true;
    this.sessions = await this.sessionService.getMySessions();
    this.loading = false;
  }

  async searchByCode(): Promise<void> {
    if (!this.inviteCode) return;
    this.foundSession = await this.sessionService.findByInviteCode(this.inviteCode.toUpperCase());
    if (!this.foundSession) {
      this.snackBar.open('Ingen session hittades med den koden', 'OK', { duration: 3000 });
    }
  }
}
