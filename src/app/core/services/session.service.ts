import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc,
  getDocs, getDoc, query, where, orderBy, arrayUnion,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { GameSession, SessionPlayer, generateInviteCode } from '../../shared/models/session.model';
import { Character } from '../../shared/models/character.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private sessionsCollection = collection(this.firestore, 'sessions');

  async getMySessions(): Promise<GameSession[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return [];
    const createdQuery = query(this.sessionsCollection, where('createdBy', '==', uid), orderBy('updatedAt', 'desc'));
    const createdSnap = await getDocs(createdQuery);
    const created = createdSnap.docs.map(d => ({ id: d.id, ...d.data() } as GameSession));
    const playerQuery = query(this.sessionsCollection, where('playerIds', 'array-contains', uid), orderBy('updatedAt', 'desc'));
    const playerSnap = await getDocs(playerQuery);
    const joined = playerSnap.docs.map(d => ({ id: d.id, ...d.data() } as GameSession));
    const allSessions = new Map<string, GameSession>();
    [...created, ...joined].forEach(s => { if (s.id) allSessions.set(s.id, s); });
    return Array.from(allSessions.values());
  }

  async getSession(id: string): Promise<GameSession | null> {
    const docRef = doc(this.firestore, `sessions/${id}`);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as GameSession;
  }

  async createSession(name: string, description: string, maxPlayers: number = 6): Promise<string> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const gmPlayer: SessionPlayer = {
      userId: uid, displayName: this.auth.currentUser?.displayName || 'Spelledare',
      role: 'gm', sourceCharacterId: null, sessionCharacter: null, joinedAt: new Date(),
    };
    const session: any = {
      name, description, createdBy: uid, createdAt: new Date(), updatedAt: new Date(),
      status: 'active', players: [gmPlayer], playerIds: [uid],
      inviteCode: generateInviteCode(), maxPlayers,
    };
    const docRef = await addDoc(this.sessionsCollection, session);
    return docRef.id;
  }

  async joinSession(inviteCode: string, role: 'player' | 'gm', character: Character | null): Promise<string | null> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const q = query(this.sessionsCollection, where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const sessionDoc = snapshot.docs[0];
    const session = { id: sessionDoc.id, ...sessionDoc.data() } as GameSession;
    if (session.players.some(p => p.userId === uid)) return session.id!;
    if (session.players.length >= session.maxPlayers) throw new Error('Sessionen är full');
    const newPlayer: SessionPlayer = {
      userId: uid, displayName: this.auth.currentUser?.displayName || 'Spelare',
      role, sourceCharacterId: character?.id || null,
      sessionCharacter: character ? { ...character, level: 1, experience: 0 } : null,
      joinedAt: new Date(),
    };
    await updateDoc(doc(this.firestore, `sessions/${session.id}`), {
      players: arrayUnion(newPlayer), playerIds: arrayUnion(uid), updatedAt: new Date(),
    });
    return session.id!;
  }

  async findByInviteCode(code: string): Promise<GameSession | null> {
    const q = query(this.sessionsCollection, where('inviteCode', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as GameSession;
  }

  async updateSessionCharacter(sessionId: string, userId: string, character: Character): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    const updatedPlayers = session.players.map(p =>
      p.userId === userId ? { ...p, sessionCharacter: character } : p
    );
    await updateDoc(doc(this.firestore, `sessions/${sessionId}`), { players: updatedPlayers, updatedAt: new Date() });
  }
}
