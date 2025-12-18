export enum CardType {
  ATTACK = 'ATTACK',
  HEAL = 'HEAL',
  TRAP = 'TRAP',
  UTILITY = 'UTILITY',
  DISCARD = 'DISCARD',
  MANIPULATION = 'MANIPULATION',
  INSTANT = 'INSTANT'
}

export enum StatusType {
  BURN = 'BURN',       // DOT Damage
  FRAGILE = 'FRAGILE', // Take extra damage
  WEAK = 'WEAK',       // Deal less damage
  STUN = 'STUN'        // Prevents Rotation
}

export interface StatusEffect {
  type: StatusType;
  duration: number; // Turns remaining
  value?: number; // E.g., burn damage amount or fragile multiplier
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  damage?: number; // Negative for healing
  description: string;
  type: CardType;
  image: string;
  canTargetBackline?: boolean; // If true, can target positions 1 and 2
  applyStatus?: StatusEffect; // Applies this status to target
}

export interface Character {
  id: string;
  name: string;
  maxHealth: number;
  currentHealth: number;
  position: 0 | 1 | 2; // 0: Top/Front, 1: Right/Back, 2: Left/Back
  passive: string;
  image: string;
  isDead: boolean;
  statuses: StatusEffect[];
  animationState?: 'hit' | 'heal' | 'idle'; // Visual state
}

export interface CardInSlot {
  instanceId: string;
  card: Card;
  isReady: boolean;
}

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  score: number; // Win condition: 3
  soulPoints: number;
  maxSoulPoints: number; 
  hand: Card[];
  slots: (CardInSlot | null)[]; // 6 Slots in front of player
  disabledSlots: number[]; // Indices of slots that are disabled/locked
  deck: Card[];
  discard: Card[]; // Cards move here after use
  lastPlayedCard: Card | null; // Track the last card played for UI history
  board: Character[];
  isTurn: boolean;
  diceRolled: boolean;
}

export enum GamePhase {
  START = 'START',
  DECK_BUILDING = 'DECK_BUILDING',
  ROLL_PHASE = 'ROLL_PHASE',
  MAIN_PHASE = 'MAIN_PHASE',
  OPPONENT_THINKING = 'OPPONENT_THINKING',
  GAME_OVER = 'GAME_OVER',
  WAITING_FOR_OPPONENT = 'WAITING_FOR_OPPONENT'
}

export enum GameMode {
  AI = 'AI',
  ONLINE = 'ONLINE'
}

export type LogType = 'player' | 'opponent' | 'system';

export interface LogEntry {
  id: string;
  message: string;
  type: LogType;
  timestamp: string;
  turn: number;
}

// --- SOCKET TYPES ---

export interface SocketMessage {
  type: 'JOIN_ROOM' | 'PLAYER_JOINED' | 'GAME_START' | 'ACTION' | 'SYNC_STATE' | 'INTRODUCE' | 'WELCOME' | 'SYNC_LOADOUT';
  payload: any;
}

export interface OnlineActionPayload {
  actionType: 'CAST_SPELL' | 'END_TURN' | 'ROLL_DICE' | 'ROTATE' | 'BURN_CARD' | 'PLACE_CARD' | 'RESET_SLOTS' | 'BUY_CARD' | 'CONCEDE' | 'GAME_OVER' | 'TRAP_TRIGGERED';
  data: {
      value?: number;
      card?: Card;
      targetId?: string;
      slotIndex?: number;
      effectTargetSlotIndex?: number;
      currentSoulPoints?: number; // For synchronization
      winnerId?: string;
      handCount?: number; // For synchronization
  };
}