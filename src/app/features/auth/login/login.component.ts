import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>D&D 3.5 Karaktärsblad</mat-card-title>
          <mat-card-subtitle>Logga in för att hantera dina karaktärer</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="login-hero">
            <mat-icon class="hero-icon">auto_stories</mat-icon>
            <p>Skapa och hantera dina rollspelskaraktärer, delta i spelsessioner och håll koll på alla formler och beräkningar.</p>
          </div>
        </mat-card-content>
        <mat-card-actions align="end">
          <button mat-raised-button color="primary" (click)="login()" class="google-btn">
            <mat-icon>login</mat-icon>
            Logga in med Google
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 70vh;
    }
    .login-card {
      max-width: 450px;
      width: 100%;
      text-align: center;
    }
    .login-hero {
      padding: 24px 0;
    }
    .hero-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #3f51b5;
    }
    .google-btn {
      margin: 8px;
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);

  async login(): Promise<void> {
    await this.authService.loginWithGoogle();
  }
}
