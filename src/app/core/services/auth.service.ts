import { Injectable, inject } from '@angular/core';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AppUser } from '../../shared/models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  user$: Observable<User | null> = user(this.auth);
  isAuthenticated$: Observable<boolean> = this.user$.pipe(map(u => !!u));

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    if (result.user) {
      await this.updateUserProfile(result.user);
      this.router.navigate(['/characters']);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  private async updateUserProfile(firebaseUser: User): Promise<void> {
    const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userSnap = await getDoc(userRef);
    const userData: AppUser = {
      uid: firebaseUser.uid,
      displayName: firebaseUser.displayName || 'Anonym',
      email: firebaseUser.email || '',
      photoURL: firebaseUser.photoURL || '',
      lastLogin: new Date(),
      createdAt: userSnap.exists() ? userSnap.data()['createdAt'] : new Date(),
    };
    await setDoc(userRef, userData, { merge: true });
  }
}
