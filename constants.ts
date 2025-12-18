import { Card, CardType, Character, StatusType, DeckLoadout } from './types';

export const CARDS_DB: Card[] = [
  // --- ATTACK ---
  {
    id: 'atk-1',
    name: 'Fireball',
    cost: 1,
    damage: 20,
    type: CardType.ATTACK,
    description: 'Deal 20 Dmg to Front.',
    image: 'https://picsum.photos/200/300?random=1',
    canTargetBackline: false
  },
  {
    id: 'atk-2',
    name: 'Snipe',
    cost: 2,
    damage: 35,
    type: CardType.ATTACK,
    description: 'Deal 35 Dmg. Can hit Back.',
    image: 'https://picsum.photos/200/300?random=2',
    canTargetBackline: true
  },
  {
    id: 'atk-3',
    name: 'Meteor',
    cost: 3,
    damage: 60,
    type: CardType.ATTACK,
    description: 'Deal 60 Dmg to Front.',
    image: 'https://picsum.photos/200/300?random=6',
    canTargetBackline: false
  },
  {
    id: 'atk-ignite',
    name: 'Ignite',
    cost: 1,
    damage: 10,
    type: CardType.ATTACK,
    description: 'Deal 10 Dmg + Burn (10 dmg/turn) for 2 turns.',
    image: 'https://picsum.photos/200/300?random=50',
    canTargetBackline: false,
    applyStatus: { type: StatusType.BURN, duration: 2, value: 10 }
  },

  // --- HEAL ---
  {
    id: 'heal-1',
    name: 'Nature\'s Balm',
    cost: 1,
    damage: -25,
    type: CardType.HEAL,
    description: 'Heal 25 HP.',
    image: 'https://picsum.photos/200/300?random=3'
  },
  {
    id: 'heal-2',
    name: 'Holy Light',
    cost: 2,
    damage: -50,
    type: CardType.HEAL,
    description: 'Heal 50 HP.',
    image: 'https://picsum.photos/200/300?random=16'
  },

  // --- TRAP ---
  {
    id: 'trap-1',
    name: 'Bear Trap',
    cost: 1,
    damage: 25,
    type: CardType.TRAP,
    description: 'Counters slot discard. Deal 25 Dmg.',
    image: 'https://picsum.photos/200/300?random=5'
  },
  {
    id: 'trap-mirror',
    name: 'Mirror Force',
    cost: 2,
    damage: 40,
    type: CardType.TRAP,
    description: 'Counters slot discard. Deal 40 Dmg.',
    image: 'https://picsum.photos/200/300?random=26'
  },

  // --- UTILITY ---
  {
    id: 'util-1',
    name: 'Soul Harvest',
    cost: 1,
    damage: 0,
    type: CardType.UTILITY,
    description: 'Draw 2 Cards.',
    image: 'https://picsum.photos/200/300?random=4'
  },
  {
    id: 'util-2',
    name: 'Focus',
    cost: 0,
    damage: 0,
    type: CardType.UTILITY,
    description: 'Gain 1 Soul Point.',
    image: 'https://picsum.photos/200/300?random=27'
  },

  // --- DISCARD ---
  {
    id: 'disc-1',
    name: 'Mind Rot',
    cost: 2,
    damage: 0,
    type: CardType.DISCARD,
    description: 'Select 1 enemy spell slot to discard.',
    image: 'https://picsum.photos/200/300?random=7'
  },
  {
    id: 'disc-3',
    name: 'Thought Theft',
    cost: 1,
    damage: 0,
    type: CardType.DISCARD,
    description: 'Discard 1 enemy spell slot. You draw 1.',
    image: 'https://picsum.photos/200/300?random=32'
  },

  // --- MANIPULATION ---
  {
    id: 'man-1',
    name: 'Lockdown',
    cost: 2,
    damage: 0,
    type: CardType.MANIPULATION,
    description: 'Disable Selected Slot for 1 Turn.',
    image: 'https://picsum.photos/200/300?random=8'
  },
  {
    id: 'man-2',
    name: 'Soul Drain',
    cost: 1,
    damage: 0,
    type: CardType.MANIPULATION,
    description: 'Steal 1 Soul Point.',
    image: 'https://picsum.photos/200/300?random=9'
  }
];

export const CHARACTERS_DB: Character[] = [
    { id: 'c1', name: 'Sylphy', maxHealth: 100, currentHealth: 100, position: 0, passive: '+10 Heal Potency', image: 'https://picsum.photos/150/150?random=10', isDead: false, statuses: [] },
    { id: 'c2', name: 'Ragnar', maxHealth: 120, currentHealth: 120, position: 1, passive: 'Reflect 5 Dmg', image: 'https://picsum.photos/150/150?random=11', isDead: false, statuses: [] },
    { id: 'c3', name: 'Lyra', maxHealth: 80, currentHealth: 80, position: 2, passive: 'Spells cost -1 (min 1)', image: 'https://picsum.photos/150/150?random=12', isDead: false, statuses: [] },
    { id: 'c4', name: 'Ashlen', maxHealth: 100, currentHealth: 100, position: 0, passive: 'Shield -5 Dmg', image: 'https://picsum.photos/150/150?random=20', isDead: false, statuses: [] },
    { id: 'c5', name: 'Vorg', maxHealth: 140, currentHealth: 140, position: 1, passive: 'Tanky -10 Dmg', image: 'https://picsum.photos/150/150?random=21', isDead: false, statuses: [] },
    { id: 'c6', name: 'Nyx', maxHealth: 90, currentHealth: 90, position: 2, passive: 'Lifesteal +10', image: 'https://picsum.photos/150/150?random=22', isDead: false, statuses: [] }
];

// Prebuilt Deck Archetypes
export const PREBUILT_DECKS: Record<string, DeckLoadout> = {
  DAMAGE: {
    name: 'War Cry (Aggro)',
    squad: [CHARACTERS_DB[1], CHARACTERS_DB[4], CHARACTERS_DB[5]], // Ragnar, Ashlen, Vorg
    cards: [
        ...Array(5).fill(CARDS_DB[0]), // Fireball
        ...Array(5).fill(CARDS_DB[1]), // Snipe
        ...Array(5).fill(CARDS_DB[2]), // Meteor
        ...Array(5).fill(CARDS_DB[3]), // Ignite
        ...Array(5).fill(CARDS_DB[8]), // Soul Harvest
        ...Array(5).fill(CARDS_DB[9])  // Focus
    ]
  },
  HEAL: {
    name: 'Aura of Light (Control)',
    squad: [CHARACTERS_DB[0], CHARACTERS_DB[2], CHARACTERS_DB[4]], // Sylphy, Lyra, Ashlen
    cards: [
        ...Array(8).fill(CARDS_DB[4]), // Nature Balm
        ...Array(7).fill(CARDS_DB[5]), // Holy Light
        ...Array(5).fill(CARDS_DB[0]), // Fireball (Defense)
        ...Array(5).fill(CARDS_DB[8]), // Soul Harvest
        ...Array(5).fill(CARDS_DB[12]) // Lockdown
    ]
  },
  TRAP: {
    name: 'Cunning Shadow (Combo)',
    squad: [CHARACTERS_DB[2], CHARACTERS_DB[5], CHARACTERS_DB[0]], // Lyra, Nyx, Sylphy
    cards: [
        ...Array(8).fill(CARDS_DB[6]), // Bear Trap
        ...Array(7).fill(CARDS_DB[7]), // Mirror Force
        ...Array(5).fill(CARDS_DB[10]), // Mind Rot
        ...Array(5).fill(CARDS_DB[11]), // Thought Theft
        ...Array(5).fill(CARDS_DB[13]) // Soul Drain
    ]
  }
};

export const INITIAL_CHARACTERS_PLAYER: Character[] = [CHARACTERS_DB[0], CHARACTERS_DB[1], CHARACTERS_DB[2]];
export const INITIAL_CHARACTERS_OPPONENT: Character[] = [CHARACTERS_DB[3], CHARACTERS_DB[4], CHARACTERS_DB[5]];
export const MAX_SCORE = 3;