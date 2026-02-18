import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'characters',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'characters',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/characters/character-list/character-list.component').then(m => m.CharacterListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./features/characters/character-form/character-form.component').then(m => m.CharacterFormComponent)
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./features/characters/character-form/character-form.component').then(m => m.CharacterFormComponent)
      },
      {
        path: ':id/sheet',
        loadComponent: () => import('./features/characters/character-sheet/character-sheet.component').then(m => m.CharacterSheetComponent)
      }
    ]
  },
  {
    path: 'sessions',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/sessions/session-list/session-list.component').then(m => m.SessionListComponent)
      },
      {
        path: 'new',
        loadComponent: () => import('./features/sessions/session-form/session-form.component').then(m => m.SessionFormComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/sessions/session-view/session-view.component').then(m => m.SessionViewComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'characters'
  }
];
