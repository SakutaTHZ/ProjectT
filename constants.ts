
import { Card, CardType, Character, StatusType } from './types';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substr(2, 9);

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
    damage: 40,
    type: CardType.ATTACK,
    description: 'Deal 40 Dmg. Can hit Back.',
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
    id: 'atk-4',
    name: 'Shadow Strike',
    cost: 1,
    damage: 15,
    type: CardType.ATTACK,
    description: 'Deal 15 Dmg. Can hit Back.',
    image: 'https://picsum.photos/200/300?random=13',
    canTargetBackline: true
  },
  {
    id: 'atk-5',
    name: 'Cleave',
    cost: 2,
    damage: 30,
    type: CardType.ATTACK,
    description: 'Deal 30 Dmg to Front.',
    image: 'https://picsum.photos/200/300?random=14',
    canTargetBackline: false
  },
  {
    id: 'atk-6',
    name: 'Execution',
    cost: 3,
    damage: 80,
    type: CardType.ATTACK,
    description: 'Deal 80 Dmg to Front.',
    image: 'https://picsum.photos/200/300?random=15',
    canTargetBackline: false
  },
  // New Status Attacks
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
  {
    id: 'atk-shatter',
    name: 'Shatter Armor',
    cost: 2,
    damage: 10,
    type: CardType.ATTACK,
    description: 'Deal 10 Dmg + Fragile (+10 Dmg taken) for 2 turns.',
    image: 'https://picsum.photos/200/300?random=51',
    canTargetBackline: false,
    applyStatus: { type: StatusType.FRAGILE, duration: 2, value: 10 }
  },
  {
    id: 'atk-stun',
    name: 'Concussion',
    cost: 2,
    damage: 15,
    type: CardType.ATTACK,
    description: 'Deal 15 Dmg + Stun (Prevents Rotation) for 1 turn.',
    image: 'https://picsum.photos/200/300?random=52',
    canTargetBackline: false,
    applyStatus: { type: StatusType.STUN, duration: 1 }
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
  {
    id: 'heal-3',
    name: 'Mend',
    cost: 0,
    damage: -10,
    type: CardType.HEAL,
    description: 'Heal 10 HP.',
    image: 'https://picsum.photos/200/300?random=17'
  },
  {
    id: 'heal-4',
    name: 'Divine Grace',
    cost: 3,
    damage: -100,
    type: CardType.HEAL,
    description: 'Heal 100 HP.',
    image: 'https://picsum.photos/200/300?random=18'
  },
  {
    id: 'heal-5',
    name: 'Regrowth',
    cost: 1,
    damage: -30,
    type: CardType.HEAL,
    description: 'Heal 30 HP.',
    image: 'https://picsum.photos/200/300?random=19'
  },

  // --- TRAP ---
  {
    id: 'trap-1',
    name: 'Bear Trap',
    cost: 1,
    damage: 20,
    type: CardType.TRAP,
    description: 'Deal 20 Dmg to target.',
    image: 'https://picsum.photos/200/300?random=5'
  },
  {
    id: 'trap-2',
    name: 'Spike Pit',
    cost: 2,
    damage: 30,
    type: CardType.TRAP,
    description: 'Deal 30 Dmg to target.',
    image: 'https://picsum.photos/200/300?random=23'
  },
  {
    id: 'trap-3',
    name: 'Explosive Rune',
    cost: 3,
    damage: 50,
    type: CardType.TRAP,
    description: 'Deal 50 Dmg to target.',
    image: 'https://picsum.photos/200/300?random=24'
  },
  {
    id: 'trap-weak',
    name: 'Intimidate',
    cost: 1,
    damage: 5,
    type: CardType.TRAP,
    description: 'Deal 5 Dmg + Weak (-10 Dmg dealt) for 2 turns.',
    image: 'https://picsum.photos/200/300?random=53',
    applyStatus: { type: StatusType.WEAK, duration: 2, value: 10 }
  },
  {
    id: 'trap-mirror',
    name: 'Mirror Force',
    cost: 2,
    damage: 30,
    type: CardType.TRAP,
    description: 'Reflect 30 damage.',
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
  {
    id: 'util-3',
    name: 'Greed',
    cost: 2,
    damage: 0,
    type: CardType.UTILITY,
    description: 'Draw 3 Cards.',
    image: 'https://picsum.photos/200/300?random=28'
  },
  {
    id: 'util-4',
    name: 'Clairvoyance',
    cost: 0,
    damage: 0,
    type: CardType.UTILITY,
    description: 'Draw 1 Card.',
    image: 'https://picsum.photos/200/300?random=29'
  },
  {
    id: 'util-5',
    name: 'Preparation',
    cost: 1,
    damage: 0,
    type: CardType.UTILITY,
    description: 'Gain 2 Soul Points.',
    image: 'https://picsum.photos/200/300?random=30'
  },

  // --- DISCARD ---
  {
    id: 'disc-1',
    name: 'Mind Rot',
    cost: 2,
    damage: 0,
    type: CardType.DISCARD,
    description: 'Discard 1 Random Enemy Card.',
    image: 'https://picsum.photos/200/300?random=7'
  },
  {
    id: 'disc-2',
    name: 'Amnesia',
    cost: 3,
    damage: 0,
    type: CardType.DISCARD,
    description: 'Discard 2 Random Enemy Cards.',
    image: 'https://picsum.photos/200/300?random=31'
  },
  {
    id: 'disc-3',
    name: 'Thought Theft',
    cost: 1,
    damage: 0,
    type: CardType.DISCARD,
    description: 'Opponent Discards 1, You Draw 1.',
    image: 'https://picsum.photos/200/300?random=32'
  },
  {
    id: 'disc-4',
    name: 'Mental Collapse',
    cost: 2,
    damage: 0,
    type: CardType.DISCARD,
    description: 'Discard 1 Card. Deal 10 Dmg to Front.',
    image: 'https://picsum.photos/200/300?random=33'
  },
  {
    id: 'disc-5',
    name: 'Confusion',
    cost: 1,
    damage: 0,
    type: CardType.DISCARD,
    description: 'Discard 1 Card. Target acts randomly (Flavor).',
    image: 'https://picsum.photos/200/300?random=34'
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
  },
  {
    id: 'man-3',
    name: 'Soul Infusion',
    cost: 1,
    damage: 0,
    type: CardType.MANIPULATION,
    description: 'Gain 2 Soul Points.',
    image: 'https://picsum.photos/200/300?random=10'
  },
  {
    id: 'man-4',
    name: 'Time Warp',
    cost: 3,
    damage: 0,
    type: CardType.MANIPULATION,
    description: 'Draw 1. Reset all your slots.',
    image: 'https://picsum.photos/200/300?random=35'
  },
  {
    id: 'man-5',
    name: 'Overload',
    cost: 2,
    damage: 0,
    type: CardType.MANIPULATION,
    description: 'Opponent loses 2 Soul Points.',
    image: 'https://picsum.photos/200/300?random=36'
  }
];

export const CHARACTERS_DB: Character[] = [
    {
      id: 'char_1',
      name: 'Sylphy',
      maxHealth: 100,
      currentHealth: 100,
      position: 0,
      passive: '+10 Heal Potency',
      image: 'https://picsum.photos/150/150?random=10',
      isDead: false,
      statuses: []
    },
    {
      id: 'char_2',
      name: 'Ragnar',
      maxHealth: 120,
      currentHealth: 120,
      position: 1,
      passive: 'Reflect 5 Dmg',
      image: 'https://picsum.photos/150/150?random=11',
      isDead: false,
      statuses: []
    },
    {
      id: 'char_3',
      name: 'Lyra',
      maxHealth: 80,
      currentHealth: 80,
      position: 2,
      passive: 'Spells cost -1 (min 1)',
      image: 'https://picsum.photos/150/150?random=12',
      isDead: false,
      statuses: []
    },
    {
      id: 'char_4',
      name: 'Ashlen',
      maxHealth: 100,
      currentHealth: 100,
      position: 0,
      passive: 'Shield -5 Dmg',
      image: 'https://picsum.photos/150/150?random=20',
      isDead: false,
      statuses: []
    },
    {
      id: 'char_5',
      name: 'Vorg',
      maxHealth: 140,
      currentHealth: 140,
      position: 1,
      passive: 'Tanky -10 Dmg',
      image: 'https://picsum.photos/150/150?random=21',
      isDead: false,
      statuses: []
    },
    {
      id: 'char_6',
      name: 'Nyx',
      maxHealth: 90,
      currentHealth: 90,
      position: 2,
      passive: 'Lifesteal +10',
      image: 'https://picsum.photos/150/150?random=22',
      isDead: false,
      statuses: []
    },
    {
        id: 'char_7',
        name: 'Kael',
        maxHealth: 110,
        currentHealth: 110,
        position: 0,
        passive: '+5 Attack Dmg',
        image: 'https://picsum.photos/150/150?random=40',
        isDead: false,
        statuses: []
    },
    {
        id: 'char_8',
        name: 'Elara',
        maxHealth: 85,
        currentHealth: 85,
        position: 0,
        passive: 'Immune to Traps',
        image: 'https://picsum.photos/150/150?random=41',
        isDead: false,
        statuses: []
    }
];

export const INITIAL_CHARACTERS_PLAYER: Character[] = [CHARACTERS_DB[0], CHARACTERS_DB[1], CHARACTERS_DB[2]];
export const INITIAL_CHARACTERS_OPPONENT: Character[] = [CHARACTERS_DB[3], CHARACTERS_DB[4], CHARACTERS_DB[5]];

export const MAX_SCORE = 3;