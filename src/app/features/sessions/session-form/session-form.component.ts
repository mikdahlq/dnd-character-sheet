import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-session-form',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1>Ny Spelsession</h1>
      <button mat-button routerLink="/sessions"><mat-icon>arrow_back</mat-icon> Tillbaka</button>
    </div>
    <mat-card>
      <mat-card-content>
        <mat-form-field class="full-width">
          <mat-label>Sessionens namn</mat-label>
          <input matInput [(ngModel)]="name" placeholder="T.ex. 'Drakskatts \u00e4ventyr'">
        </mat-form-field>
        <mat-form-field class="full-width">
          <mat-label>Beskrivning</mat-label>
          <textarea matInput [(ngModel)]="description" rows="4" placeholder="Beskriv sessionen..."></textarea>
        </mat-form-field>
        <mat-form-field class="full-width">
          <mat-label>Max antal spelare</mat-label>
          <input matInput type="number" [(ngModel)]="maxPlayers" min="2" max="12">
        </mat-form-field>
      </mat-card-content>
      <mat-card-actions align="end">
        <button mat-raised-button color="primary" (click)="create()" [disabled]="!name || isCreating">
          @if (isCreating) {
            <mat-spinner diameter="20"></mat-spinner> Skapar...
          } @else {
            <mat-icon>add</mat-icon> Skapa Session
          }
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    button mat-spinner { display: inline-block; margin-right: 6px; vertical-align: middle; }
  `]
})
export class SessionFormComponent {
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  name = '';
  description = '';
  maxPlayers = 6;
  isCreating = false;

  async create(): Promise<void> {
    this.isCreating = true;
    try {
      const id = await this.sessionService.createSession(this.name, this.description, this.maxPlayers);
      this.snackBar.open('Sessionen har skapats!', 'OK', { duration: 3000 });
      this.router.navigate(['/sessions', id]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ett okänt fel uppstod';
      this.snackBar.open(`Kunde inte skapa session: ${message}`, 'OK', { duration: 5000 });
    } finally {
      this.isCreating = false;
    }
  }
}
