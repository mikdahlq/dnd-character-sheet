import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <mat-sidenav #sidenav mode="side" opened class="app-sidenav"
        [class.collapsed]="sidenavCollapsed">
        <mat-nav-list>
          <a mat-list-item routerLink="/characters" routerLinkActive="active">
            <mat-icon matListItemIcon>person</mat-icon>
            <span *ngIf="!sidenavCollapsed">Karaktärer</span>
          </a>
          <a mat-list-item routerLink="/sessions" routerLinkActive="active">
            <mat-icon matListItemIcon>groups</mat-icon>
            <span *ngIf="!sidenavCollapsed">Spelsessioner</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="app-toolbar">
          <button mat-icon-button (click)="sidenavCollapsed = !sidenavCollapsed">
            <mat-icon>menu</mat-icon>
          </button>
          <span class="toolbar-title">D&D 3.5 Karaktärsblad</span>
          <span class="spacer"></span>
          @if (auth.user$ | async; as user) {
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="user-info" mat-menu-item disabled>
                {{ user.displayName }}
              </div>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon>
                Logga ut
              </button>
            </mat-menu>
          }
        </mat-toolbar>
        <main class="main-content">
          <ng-content></ng-content>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container {
      height: 100vh;
    }
    .app-sidenav {
      width: 220px;
      transition: width 0.3s;
    }
    .app-sidenav.collapsed {
      width: 64px;
    }
    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .toolbar-title {
      margin-left: 8px;
      font-size: 1.1rem;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .main-content {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .user-info {
      opacity: 0.7;
      font-style: italic;
    }
    .active {
      background: rgba(0, 0, 0, 0.08) !important;
    }
  `]
})
export class LayoutComponent {
  auth = inject(AuthService);
  sidenavCollapsed = false;
}
