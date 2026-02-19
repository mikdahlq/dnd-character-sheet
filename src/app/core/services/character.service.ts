import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, query, where, orderBy,
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Character, createDefaultCharacter } from '../../shared/models/character.model';

@Injectable({ providedIn: 'root' })
export class CharacterService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private charactersCollection = collection(this.firestore, 'characters');

  async getMyCharacters(): Promise<Character[]> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return [];
    const q = query(this.charactersCollection, where('userId', '==', uid), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Character));
  }

  async getCharacter(id: string): Promise<Character | null> {
    const docRef = doc(this.firestore, `characters/${id}`);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Character;
  }

  async createCharacter(character: Partial<Character>): Promise<string> {
    const uid = this.auth.currentUser?.uid;
    if (!uid) throw new Error('Not authenticated');
    const defaultChar = createDefaultCharacter(uid);
    const newChar = { ...defaultChar, ...character, userId: uid, createdAt: new Date(), updatedAt: new Date() };
    const docRef = await addDoc(this.charactersCollection, newChar);
    return docRef.id;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<void> {
    const docRef = doc(this.firestore, `characters/${id}`);
    await updateDoc(docRef, { ...updates, updatedAt: new Date() });
  }

  async deleteCharacter(id: string): Promise<void> {
    const docRef = doc(this.firestore, `characters/${id}`);
    await deleteDoc(docRef);
  }

  createSessionCopy(character: Character): Character {
    return {
      ...character, id: undefined, level: 1, experience: 0,
      baseAttackBonus: 1,
      savingThrows: { fortitudeBase: 2, reflexBase: 0, willBase: 0 },
    };
  }
}
