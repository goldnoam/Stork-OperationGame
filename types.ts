
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  LEVEL_END = 'LEVEL_END',
  GAME_OVER = 'GAME_OVER'
}

export type Language = 'he' | 'en' | 'zh' | 'hi' | 'de' | 'es' | 'fr';
export type FontSize = 'small' | 'medium' | 'large';

export type BabyMood = 'happy' | 'scared' | 'worried' | 'joyful' | 'surprised';

export interface Baby {
  id: number;
  x: number;
  y: number;
  birthTime: number; 
  speed: number;
  size: number;
  rotation: number;
  type: 'standard' | 'golden' | 'speedy';
  mood: BabyMood;
}

export interface CaughtBaby extends Baby {
  catchTime: number;
  targetX: number;
  targetY: number;
  startPosX: number;
  startPosY: number;
}

export type PowerUpType = 'slow_mo' | 'magnet';

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerUpType;
  speed: number;
  size: number;
  rotation: number;
}

export interface ActiveEffect {
  type: PowerUpType;
  endTime: number;
}

export interface Stork {
  id: number;
  x: number;
  y: number;
  direction: 1 | -1;
  nextDropTime: number;
}

export interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  opacity: number;
  life: number;
}
