import { Character } from './character.model';

export interface SessionPlayer {
  userId: string;
  displayName: string;
  role: 'player' | 'gm';
  /** Character ID from the user's list, or null if session-specific */
  sourceCharacterId: string | null;
  /** Session-specific character data (copy, not reference) */
  sessionCharacter: Character | null;
  joinedAt: Date;
}

export interface GameSession {
  id?: string;
  name: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'paused' | 'completed';
  players: SessionPlayer[];
  /** Invite code for joining */
  inviteCode: string;
  maxPlayers: number;
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
