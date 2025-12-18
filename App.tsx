import React, { useState, useEffect, useRef } from 'react';
import { Card, Character, PlayerState, GamePhase, CardType, LogEntry, LogType, StatusType, StatusEffect, GameMode, OnlineActionPayload, SocketMessage, DeckLoadout } from './types';
import { CARDS_DB, INITIAL_CHARACTERS_PLAYER, INITIAL_CHARACTERS_OPPONENT, MAX_SCORE } from './constants';
import { socketService } from './services/socket';
import { RotateCw, Swords, Ghost, Plus, Wifi, WifiOff, Clock } from 'lucide-react';

// UI Components
import StartScreen from './components/screens/StartScreen';
import GameOverScreen from './components/screens/GameOverScreen';
import DeckBuilderScreen from './components/screens/DeckBuilderScreen';
import GameLog from './components/ui/GameLog';
import SettingsModal from './components/ui/SettingsModal';
import DiceOverlay from './components/ui/DiceOverlay';
import InspectionModal from './components/ui/InspectionModal';
import CardLibraryModal from './components/ui/CardLibraryModal';
import TopBar from './components/game/TopBar';
import PlayerHUD from './components/game/PlayerHUD';

const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

const MAX_HAND_SIZE = 10;
const DRAW_PER_TURN = 2; 

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.AI);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [gameTime, setGameTime] = useState<number>(0);
  
  const phaseRef = useRef<GamePhase>(GamePhase.START);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const [notification, setNotification] = useState<string>("");
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [gameLog, setGameLog] = useState<LogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCardLibrary, setShowCardLibrary] = useState(false); 

  const [castingSlot, setCastingSlot] = useState<{playerId: string, slotIndex: number} | null>(null);
  const [burningSlotIndex, setBurningSlotIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOpponentHandRevealed, setIsOpponentHandRevealed] = useState(false);

  const [player, setPlayer] = useState<PlayerState>({
    id: 'player',
    name: 'SakutaTHZ',
    avatar: 'https://picsum.photos/50/50?random=100',
    score: 0,
    soulPoints: 0,
    maxSoulPoints: 3,
    hand: [],
    slots: Array(6).fill(null),
    disabledSlots: [],
    deck: [],
    discard: [],
    lastPlayedCard: null,
    board: deepClone(INITIAL_CHARACTERS_PLAYER),
    isTurn: true,
    diceRolled: false
  });

  const [opponent, setOpponent] = useState<PlayerState>({
    id: 'opponent',
    name: 'Ashlen',
    avatar: 'https://picsum.photos/50/50?random=101',
    score: 0,
    soulPoints: 0,
    maxSoulPoints: 3,
    hand: [],
    slots: Array(6).fill(null),
    disabledSlots: [],
    deck: [],
    discard: [],
    lastPlayedCard: null,
    board: deepClone(INITIAL_CHARACTERS_OPPONENT),
    isTurn: false,
    diceRolled: false
  });

  const playerRef = useRef(player);
  const opponentRef = useRef(opponent);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { opponentRef.current = opponent; }, [opponent]);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<Card | Character | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (phase !== GamePhase.START && phase !== GamePhase.GAME_OVER && phase !== GamePhase.DECK_BUILDING && phase !== GamePhase.WAITING_FOR_OPPONENT) {
        interval = setInterval(() => {
            setGameTime(prev => prev + 1);
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addLog = (msg: string, type: LogType = 'system') => {
    if (notificationTimerRef.current) clearTimeout(notificationTimerRef.current);
    setNotification(msg);
    notificationTimerRef.current = setTimeout(() => setNotification(""), 4000);
    setGameLog(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        message: msg,
        type: type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        turn: turnCount
    }, ...prev]);
  };

  const generateDeck = (count: number): Card[] => {
    const deck: Card[] = [];
    for (let i = 0; i < count; i++) {
        const randomCard = CARDS_DB[Math.floor(Math.random() * CARDS_DB.length)];
        deck.push({ ...randomCard, id: `deck-${Math.random().toString(36).substr(2, 9)}` });
    }
    return deck;
  };

  const drawCard = (p: PlayerState, count: number = 1): PlayerState => {
    let newDeck = [...p.deck];
    let newHand = [...p.hand];
    let newDiscard = [...p.discard];
    
    for (let i = 0; i < count; i++) {
      if (newDeck.length === 0) {
        if (newDiscard.length > 0) {
            const reshuffled = [...newDiscard];
            for (let j = reshuffled.length - 1; j > 0; j--) {
                const k = Math.floor(Math.random() * (j + 1));
                [reshuffled[j], reshuffled[k]] = [reshuffled[k], reshuffled[j]];
            }
            newDeck = reshuffled;
            newDiscard = [];
        } else break;
      }
      if (newDeck.length > 0) {
        const card = newDeck.pop();
        if (card) {
          if (newHand.length < MAX_HAND_SIZE) newHand.push(card);
          else newDiscard.push(card);
        }
      }
    }
    return { ...p, deck: newDeck, hand: newHand, discard: newDiscard };
  };

  const processTurnStart = (p: PlayerState): PlayerState => {
    let newBoard = deepClone(p.board);
    newBoard = newBoard.map(char => {
        if (char.isDead) return char;
        let newHealth = char.currentHealth;
        let animationState = char.animationState;
        const newStatuses = char.statuses.map(s => {
            if (s.type === StatusType.BURN && s.value) {
                newHealth = Math.max(0, newHealth - s.value);
                animationState = 'hit';
            }
            return { ...s, duration: s.duration - 1 };
        }).filter(s => s.duration > 0);
        return { ...char, currentHealth: newHealth, statuses: newStatuses, animationState };
    });
    newBoard.forEach(c => { if (c.currentHealth === 0 && !c.isDead) c.isDead = true; });
    return { ...p, board: newBoard };
  };

  const buyCardWithSouls = () => {
      if (isProcessing || !player.isTurn || phase !== GamePhase.MAIN_PHASE || player.soulPoints < 2) return;
      const newSoulPoints = player.soulPoints - 2;
      let nextState: PlayerState = { ...player, soulPoints: newSoulPoints };
      nextState = drawCard(nextState, 1);
      setPlayer(nextState);
      addLog("Sacrificed 2 Soul Points for a card!", 'player');
      if (gameMode === GameMode.ONLINE) {
          socketService.sendAction({ actionType: 'BUY_CARD', data: { currentSoulPoints: newSoulPoints, handCount: nextState.hand.length } });
      }
  };

  const resetPlacedSpells = () => {
      if (isProcessing || phase !== GamePhase.MAIN_PHASE || !player.isTurn) return;
      setPlayer(prev => {
          const newHand = [...prev.hand];
          const newSlots = [...prev.slots];
          let returnedCount = 0;
          for (let i = 0; i < newSlots.length; i++) {
              const slot = newSlots[i];
              if (slot && !slot.isReady) {
                  newHand.push(slot.card);
                  newSlots[i] = null;
                  returnedCount++;
              }
          }
          if (returnedCount > 0) {
               addLog(`Returned ${returnedCount} spells to hand.`, 'player');
               if (gameMode === GameMode.ONLINE) {
                   socketService.sendAction({ actionType: 'RESET_SLOTS', data: { handCount: newHand.length } });
               }
               return { ...prev, hand: newHand, slots: newSlots };
          } else return prev;
      });
  };

  const rotateCharacters = (characters: Character[]): Character[] => {
    return characters.map(char => ({
      ...char,
      position: ((char.position + 1) % 3) as 0 | 1 | 2
    }));
  };

  const getEffectiveCost = (card: Card, playerState: PlayerState = player): number => {
    const lyra = playerState.board.find(c => c.name === 'Lyra' && !c.isDead && c.position === 0);
    if (lyra && card.cost > 1) return Math.max(1, card.cost - 1);
    return card.cost;
  };

  const resetGame = () => {
      setPhase(GamePhase.START);
      setGameMode(GameMode.AI);
      socketService.disconnect();
      setTurnCount(1);
      setGameTime(0);
      setNotification("");
      setGameLog([]);
      setShowLog(false);
      setShowSettings(false);
      setShowCardLibrary(false);
      setPlayer(prev => ({ ...prev, score: 0, soulPoints: 0, hand: [], slots: Array(6).fill(null), disabledSlots: [], deck: [], discard: [], lastPlayedCard: null, board: deepClone(INITIAL_CHARACTERS_PLAYER), isTurn: true, diceRolled: false }));
      setOpponent(prev => ({ ...prev, score: 0, soulPoints: 0, hand: [], slots: Array(6).fill(null), disabledSlots: [], deck: [], discard: [], lastPlayedCard: null, board: deepClone(INITIAL_CHARACTERS_OPPONENT), isTurn: false, diceRolled: false }));
      setShowDiceOverlay(false);
      setDiceResult(null);
      setSelectedCardId(null);
      setInspectedItem(null);
      setCastingSlot(null);
      setBurningSlotIndex(null);
      setIsProcessing(false);
      setIsOpponentHandRevealed(false);
  };

  const setupBoardState = (customDeck?: Card[], customCharacters?: Character[]) => {
    setTurnCount(1);
    setGameTime(0);
    const initialPlayerDeck = customDeck ? [...customDeck] : generateDeck(30);
    // Shuffle the deck if it's from custom to ensure variety
    for (let i = initialPlayerDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [initialPlayerDeck[i], initialPlayerDeck[j]] = [initialPlayerDeck[j], initialPlayerDeck[i]];
    }
    
    const initialOpponentDeck = generateDeck(30);
    let initialPlayer = { ...player, deck: initialPlayerDeck, lastPlayedCard: null };
    if (customCharacters && customCharacters.length === 3) {
        initialPlayer.board = customCharacters.map((c, idx) => ({ 
            ...c, 
            position: idx as 0 | 1 | 2, 
            currentHealth: c.maxHealth, 
            isDead: false, 
            statuses: [] 
        }));
    } else {
        initialPlayer.board = deepClone(INITIAL_CHARACTERS_PLAYER);
    }
    
    let initialOpponent = { ...opponent, deck: initialOpponentDeck, lastPlayedCard: null };
    initialOpponent.board = deepClone(INITIAL_CHARACTERS_OPPONENT);
    
    initialPlayer = drawCard(initialPlayer, 4);
    initialOpponent = drawCard(initialOpponent, 4);
    
    setPlayer(initialPlayer);
    setOpponent(initialOpponent);
  };

  const startGame = (name: string, customDeck?: Card[], customCharacters?: Character[]) => {
    setPlayer(prev => ({ ...prev, name }));
    setupBoardState(customDeck, customCharacters);
    setPhase(GamePhase.ROLL_PHASE);
    setShowDiceOverlay(true);
    addLog(`Welcome ${name}! Roll the Soul Dice.`, 'system');
  };
  
  const startOnlineGame = (name: string, roomId: string) => {
      setPlayer(prev => ({ ...prev, name }));
      setGameMode(GameMode.ONLINE);
      setupBoardState();
      setPhase(GamePhase.WAITING_FOR_OPPONENT);
      addLog(`Connecting as ${name} to Room: ${roomId}...`, 'system');
      socketService.connect(roomId, name, 
        () => addLog("Connected to lobby. Waiting for response...", 'system'),
        (err) => { addLog(err, 'system'); setTimeout(resetGame, 3000); }
      );
  };

  useEffect(() => {
    if (gameMode !== GameMode.ONLINE) return;
    const handleSocketMessage = (msg: SocketMessage) => {
        switch (msg.type) {
            case 'PLAYER_JOINED':
                if (msg.payload.name !== playerRef.current.name) {
                    addLog(`${msg.payload.name} joined! You are Player 1.`, 'system');
                    setOpponent(prev => ({ ...prev, name: msg.payload.name }));
                    socketService.send({ type: 'WELCOME', payload: { name: playerRef.current.name, board: playerRef.current.board } });
                    setPlayer(prev => ({ ...prev, isTurn: true }));
                    setOpponent(prev => ({ ...prev, isTurn: false }));
                    setPhase(GamePhase.ROLL_PHASE);
                    setShowDiceOverlay(true);
                }
                break;
            case 'WELCOME':
                addLog(`Connected to Host: ${msg.payload.name}. Opponent starts first.`, 'system');
                setOpponent(prev => ({ ...prev, name: msg.payload.name, board: msg.payload.board }));
                socketService.send({ type: 'SYNC_LOADOUT', payload: { name: playerRef.current.name, board: playerRef.current.board } });
                setPlayer(prev => ({ ...prev, isTurn: false }));
                setOpponent(prev => ({ ...prev, isTurn: true }));
                setPhase(GamePhase.OPPONENT_THINKING); 
                setNotification("Opponent's Turn");
                break;
            case 'SYNC_LOADOUT':
                setOpponent(prev => ({ ...prev, name: msg.payload.name, board: msg.payload.board }));
                break;
            case 'ACTION':
                handleRemoteAction(msg.payload);
                break;
        }
    };
    const unsubscribe = socketService.subscribe(handleSocketMessage);
    return () => { unsubscribe(); };
  }, [gameMode]);

  const handleRemoteAction = (payload: OnlineActionPayload) => {
      const hCount = payload.data.handCount;
      const syncHand = (prev: PlayerState) => {
          if (hCount === undefined) return prev.hand;
          if (prev.hand.length === hCount) return prev.hand;
          const newHand = [...prev.hand];
          while(newHand.length < hCount) newHand.push({} as Card);
          while(newHand.length > hCount) newHand.pop();
          return newHand;
      };

      if (payload.actionType === 'ROLL_DICE') {
          const val = payload.data.value;
          setOpponent(prev => ({
              ...prev, 
              soulPoints: payload.data.currentSoulPoints ?? (prev.soulPoints + (val || 0)),
              slots: prev.slots.map(s => s ? { ...s, isReady: true } : null),
              hand: syncHand(prev)
          }));
          addLog(`${opponentRef.current.name} rolled ${val}.`, 'opponent');
      } 
      else if (payload.actionType === 'ROTATE') {
          setOpponent(prev => ({ ...prev, board: rotateCharacters(prev.board) }));
      }
      else if (payload.actionType === 'PLACE_CARD') {
             const { card, slotIndex } = payload.data;
             setOpponent(prev => {
                 const newSlots = [...prev.slots];
                 if (slotIndex !== undefined && card) newSlots[slotIndex] = { instanceId: card.id, card, isReady: false };
                 return { ...prev, slots: newSlots, hand: syncHand(prev) };
             });
             addLog("Opponent set a card.", 'opponent');
      }
      else if (payload.actionType === 'TRAP_TRIGGERED') {
           const { card, currentSoulPoints } = payload.data;
           if (card) {
               addLog(`OPPONENT'S TRAP TRIGGERED: ${card.name}!`, 'opponent');
               // Target of the trap is the player (ME)
               executeSpell(opponentRef.current, setOpponent, playerRef.current, setPlayer, card, playerRef.current.board.find(c => c.position === 0)?.id || '', -1);
               if (currentSoulPoints !== undefined) setOpponent(prev => ({ ...prev, soulPoints: currentSoulPoints }));
           }
      }
      else if (payload.actionType === 'CAST_SPELL') {
          const { card, targetId, slotIndex, effectTargetSlotIndex, currentSoulPoints } = payload.data;
          if (card) {
             executeSpell(opponentRef.current, setOpponent, playerRef.current, setPlayer, card, targetId || '', slotIndex ?? -1, effectTargetSlotIndex);
             if (currentSoulPoints !== undefined) {
                 setTimeout(() => { setOpponent(prev => ({ ...prev, soulPoints: currentSoulPoints, hand: syncHand(prev) })); }, 800);
             }
          }
      }
      else if (payload.actionType === 'END_TURN') {
          addLog("Opponent ended turn.", 'opponent');
          setIsOpponentHandRevealed(false);
          setOpponent(prev => ({ ...prev, disabledSlots: [], hand: syncHand(prev) }));
          setPlayer(prev => {
             const p = drawCard(prev, DRAW_PER_TURN);
             const processedP = processTurnStart(p);
             const allDead = processedP.board.every(c => c.isDead);
             if (allDead) {
                 setTimeout(() => {
                     setPhase(GamePhase.GAME_OVER);
                     setOpponent(o => ({...o, score: MAX_SCORE}));
                     addLog("DEFEAT! Your party has fallen.", 'system');
                     if(gameMode === GameMode.ONLINE) socketService.sendAction({ actionType: 'GAME_OVER', data: { winnerId: opponentRef.current.id } });
                 }, 500);
             }
             return { ...processedP, isTurn: true, diceRolled: false };
          });
          if (phaseRef.current !== GamePhase.GAME_OVER) {
             setPhase(GamePhase.ROLL_PHASE);
             setShowDiceOverlay(true);
             addLog("Your Turn!", 'system');
             setTurnCount(prev => prev + 1);
          }
      }
  };

  const performDiceRoll = () => {
    if (isRollingDice || diceResult !== null) return;
    setIsRollingDice(true);
    setTimeout(() => {
        const value = Math.floor(Math.random() * 3) + 1;
        setDiceResult(value);
        setIsRollingDice(false);
        setPlayer(prev => {
            const nextSoulPoints = prev.soulPoints + value;
            const activeChar = prev.board.find(c => c.position === 0);
            const isStunned = activeChar?.statuses.some(s => s.type === StatusType.STUN);
            let newBoard = prev.board;
            if (isStunned) addLog("Active Character Stunned! Rotation Locked.", 'system');
            else {
                newBoard = rotateCharacters(prev.board);
                if (gameMode === GameMode.ONLINE) socketService.sendAction({ actionType: 'ROTATE', data: {} });
            }
            if (gameMode === GameMode.ONLINE) socketService.sendAction({ actionType: 'ROLL_DICE', data: { value, currentSoulPoints: nextSoulPoints, handCount: prev.hand.length } });
            return { ...prev, soulPoints: nextSoulPoints, diceRolled: true, board: newBoard, slots: prev.slots.map(s => s ? { ...s, isReady: true } : null) };
        });
        setShowDiceOverlay(false);
        setDiceResult(null);
        setPhase(GamePhase.MAIN_PHASE);
        addLog(`Gained ${value} Soul Points.`, 'player');
    }, 1500);
  };

  const placeCardInSlot = (card: Card, targetSlotIndex?: number) => {
      if (isProcessing) return;
      let slotIndex = -1;
      if (targetSlotIndex !== undefined) {
          if (player.disabledSlots.includes(targetSlotIndex)) { addLog("Slot is DISABLED!", 'system'); return; }
          if (player.slots[targetSlotIndex] === null) slotIndex = targetSlotIndex;
          else { addLog("Slot is occupied!", 'system'); return; }
      } else slotIndex = player.slots.findIndex((s, idx) => s === null && !player.disabledSlots.includes(idx));
      if (slotIndex === -1) { addLog("No available slots!", 'system'); return; }

      setPlayer(prev => {
          const newSlots = [...prev.slots];
          newSlots[slotIndex] = { instanceId: card.id, card: card, isReady: false };
          const nextHand = prev.hand.filter(c => c.id !== card.id);
          if (gameMode === GameMode.ONLINE) socketService.sendAction({ actionType: 'PLACE_CARD', data: { card, slotIndex, handCount: nextHand.length } });
          return { ...prev, slots: newSlots, hand: nextHand };
      });
      addLog(`Set ${card.name} in Slot ${slotIndex + 1}.`, 'player');
  };

  const burnCardInSlot = (e: React.MouseEvent, slotIndex: number) => {
      e.stopPropagation(); 
      if (isProcessing || !player.slots[slotIndex]) return;
      const slot = player.slots[slotIndex]!;
      if (!slot.isReady) { addLog("Can only sacrifice active spells!", 'system'); return; }
      const nextSoulPoints = player.soulPoints + 1;
      setIsProcessing(true);
      setBurningSlotIndex(slotIndex);
      setTimeout(() => {
          setPlayer(prev => {
              const newSlots = [...prev.slots];
              newSlots[slotIndex] = null;
              if (gameMode === GameMode.ONLINE) socketService.sendAction({ actionType: 'BURN_CARD', data: { slotIndex, currentSoulPoints: nextSoulPoints, handCount: prev.hand.length } });
              return { ...prev, slots: newSlots, soulPoints: nextSoulPoints, discard: [...prev.discard, slot.card] };
          });
          addLog(`Sacrificed ${slot.card.name} for +1 Soul Point.`, 'player');
          setBurningSlotIndex(null);
          setIsProcessing(false);
      }, 700);
  };

  const handleDragStart = (e: React.DragEvent, card: Card) => { e.dataTransfer.setData("cardId", card.id); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault();
      if (isProcessing || phase !== GamePhase.MAIN_PHASE || !player.isTurn) return;
      const cardId = e.dataTransfer.getData("cardId");
      const card = player.hand.find(c => c.id === cardId);
      if (card) { if (card.type === CardType.INSTANT) addLog("Instant spells cannot be placed in slots!", "system"); else placeCardInSlot(card, slotIndex); }
  };
  
  const handleHandCardClick = (card: Card) => { 
      if (phase !== GamePhase.MAIN_PHASE || !player.isTurn || isProcessing) return;
      if (card.type === CardType.INSTANT) {
          const cost = getEffectiveCost(card, player);
          if (player.soulPoints < cost) { addLog("Not enough Soul Points!", 'system'); return; }
          handleSpellExecution(player, setPlayer, opponent, setOpponent, card, '', -1); 
      } else placeCardInSlot(card); 
  };

  const handleSlotCardClick = (slotIndex: number) => {
    if (isProcessing || phase !== GamePhase.MAIN_PHASE || !player.isTurn) return;
    if (player.disabledSlots.includes(slotIndex)) { addLog("Slot is DISABLED!", 'system'); return; }
    const slot = player.slots[slotIndex];
    if (!slot || !slot.isReady) return;
    const card = slot.card;
    const cost = getEffectiveCost(card, player);
    if (player.soulPoints < cost) { addLog("Not enough Soul Points!", 'system'); return; }
    
    // Direct Self-Cast Spells
    if (["Soul Harvest", "Soul Infusion", "Greed", "Focus", "Preparation", "Clairvoyance", "Spell Shatter", "Equalizing Flow", "Rapid Reflex", "Unstable Rift", "Eagle Eye"].includes(card.name)) { 
        handleSpellExecution(player, setPlayer, player, setPlayer, card, player.id, slotIndex); return; 
    }
    
    // Target Selection Spells
    if (["Mind Rot", "Amnesia", "Thought Theft", "Soul Drain", "Lockdown"].includes(card.name) || card.type === CardType.DISCARD) { 
        setSelectedCardId(card.id);
        addLog(`Select enemy SPELL SLOT to discard.`, 'system');
        return; 
    }
    
    if (selectedCardId === card.id) setSelectedCardId(null);
    else {
      setSelectedCardId(card.id);
      addLog(`Select a target ${card.canTargetBackline ? "(Any Position)" : "(Front Only)"}`, 'system');
    }
  };

  const handleOpponentSlotClick = (targetSlotIndex: number) => {
      if (isProcessing || !selectedCardId) return;
      const playerSlotIndex = player.slots.findIndex(s => s && s.card.id === selectedCardId);
      if (playerSlotIndex === -1) return;
      const card = player.slots[playerSlotIndex]!.card;
      if (card.name === "Lockdown" || card.type === CardType.DISCARD) {
          handleSpellExecution(player, setPlayer, opponent, setOpponent, card, opponent.id, playerSlotIndex, targetSlotIndex);
          setSelectedCardId(null);
      }
  };

  const isCharacterValidTarget = (char: Character, isEnemy: boolean): boolean => {
      if (!selectedCardId) return false;
      const slot = player.slots.find(s => s && s.card.id === selectedCardId);
      if (!slot) return false;
      const card = slot.card;
      if (card.type === CardType.ATTACK && !isEnemy) return false;
      if (card.type === CardType.HEAL && isEnemy) return false;
      if (card.type === CardType.DISCARD || card.type === CardType.MANIPULATION) return false; 
      if (card.type === CardType.ATTACK && char.position !== 0 && !card.canTargetBackline) return false;
      return true;
  };

  const handleTargetClick = (target: Character, isEnemy: boolean) => {
    if (isProcessing || !selectedCardId) return;
    const slotIndex = player.slots.findIndex(s => s && s.card.id === selectedCardId);
    if (slotIndex === -1) return;
    const card = player.slots[slotIndex]!.card;
    if (card.type === CardType.ATTACK && !isEnemy) return;
    if (card.type === CardType.HEAL && isEnemy) return;
    if (card.name === "Lockdown" || card.type === CardType.DISCARD) return;
    handleSpellExecution(player, setPlayer, isEnemy ? opponent : player, isEnemy ? setOpponent : setPlayer, card, target.id, slotIndex);
    setSelectedCardId(null);
  };

  const handlePlayerTargetClick = (isOpponent: boolean) => {
      if (isProcessing || !selectedCardId) return;
      const slotIndex = player.slots.findIndex(s => s && s.card.id === selectedCardId);
      if (slotIndex === -1) return;
      const card = player.slots[slotIndex]!.card;
      if (card.name === "Soul Drain" && isOpponent) {
          handleSpellExecution(player, setPlayer, opponent, setOpponent, card, opponent.id, slotIndex);
          setSelectedCardId(null);
      }
  };

  const handleSpellExecution = (
    caster: PlayerState, setCaster: React.Dispatch<React.SetStateAction<PlayerState>>, 
    targeter: PlayerState, setTargeter: React.Dispatch<React.SetStateAction<PlayerState>>, 
    card: Card, targetId: string, slotIndex: number, effectTargetSlotIndex?: number
  ) => {
      // TRAP CHECK: Triggered when casting on Enemy slots
      if (caster.id === 'player' && targeter.id === 'opponent' && effectTargetSlotIndex !== undefined && card.type === CardType.DISCARD) {
          const trapIdx = targeter.slots.findIndex(s => s && s.isReady && s.card.type === CardType.TRAP);
          if (trapIdx !== -1) {
              const trapSlot = targeter.slots[trapIdx]!;
              const trapCost = getEffectiveCost(trapSlot.card, targeter);
              if (targeter.soulPoints >= trapCost) {
                  addLog(`TRAP TRIGGERED! ${targeter.name}'s ${trapSlot.card.name} counters you!`, 'system');
                  const trapCard = trapSlot.card;
                  const nextOpponentSP = targeter.soulPoints - trapCost;
                  
                  // Trigger Trap Effect on Me
                  executeSpell(targeter, setTargeter, caster, setCaster, trapCard, caster.board.find(c => c.position === 0)?.id || '', -1);
                  
                  // Consume Trap
                  setTargeter(prev => { 
                      const n = [...prev.slots]; n[trapIdx] = null; 
                      return { ...prev, slots: n, soulPoints: nextOpponentSP, discard: [...prev.discard, trapCard] }; 
                  });
                  
                  // Consume Attacker Spell and SP (but negate effect)
                  setCaster(prev => {
                      const cCost = getEffectiveCost(card, prev);
                      const nSlots = [...prev.slots]; if (slotIndex >= 0) nSlots[slotIndex] = null;
                      const nextHand = slotIndex < 0 ? prev.hand.filter(c => c.id !== card.id) : prev.hand;
                      if (gameMode === GameMode.ONLINE) {
                          socketService.sendAction({ actionType: 'TRAP_TRIGGERED', data: { card: trapCard, currentSoulPoints: nextOpponentSP, handCount: nextHand.length } });
                          socketService.sendAction({ actionType: 'CAST_SPELL', data: { card, targetId: 'COUNTERED', slotIndex, currentSoulPoints: prev.soulPoints - cCost, handCount: nextHand.length } });
                      }
                      return { ...prev, slots: nSlots, hand: nextHand, soulPoints: prev.soulPoints - cCost, discard: [...prev.discard, card] };
                  });
                  return;
              }
          }
      }

      executeSpell(caster, setCaster, targeter, setTargeter, card, targetId, slotIndex, effectTargetSlotIndex);
      if (gameMode === GameMode.ONLINE && caster.id === 'player') {
          const cost = getEffectiveCost(card, caster);
          let nextSP = caster.soulPoints - cost;
          if (card.name === "Equalizing Flow") nextSP = Math.floor((nextSP + targeter.soulPoints) / 2);
          else if (card.name === "Soul Drain") nextSP += 1;
          else if (card.name === "Focus") nextSP += 1;
          else if (card.name === "Preparation" || card.name === "Soul Infusion") nextSP += 2;
          const nextHandCount = slotIndex < 0 ? caster.hand.length - 1 : caster.hand.length;
          socketService.sendAction({ actionType: 'CAST_SPELL', data: { card, targetId, slotIndex, effectTargetSlotIndex, currentSoulPoints: nextSP, handCount: nextHandCount } });
      }
  };

  const executeSpell = (
    caster: PlayerState, setCaster: React.Dispatch<React.SetStateAction<PlayerState>>, 
    targeter: PlayerState, setTargeter: React.Dispatch<React.SetStateAction<PlayerState>>, 
    card: Card, targetId: string, slotIndex: number, effectTargetSlotIndex?: number
  ) => {
    if (isProcessing || targetId === 'COUNTERED') return;
    setIsProcessing(true);
    if (slotIndex >= 0) setCastingSlot({ playerId: caster.id, slotIndex });
    addLog(`${caster.name} cast ${card.name}!`, caster.id === 'player' ? 'player' : 'opponent');
    
    setTimeout(() => {
        const activeCasterChar = caster.board.find(c => c.position === 0);
        const hasSylphy = caster.board.some(c => c.name === 'Sylphy' && !c.isDead && c.position === 0);
        const casterIsNyx = activeCasterChar?.name === 'Nyx' && !activeCasterChar.isDead;
        const cost = getEffectiveCost(card, caster);
        let killCount = 0; let reflectDamage = 0; let stolenSouls = 0;
        let newTargetBoard = deepClone(targeter.board); let newTargetHand = [...targeter.hand];
        let newTargetDiscard = [...targeter.discard]; let newTargetDisabledSlots = [...targeter.disabledSlots];
        let newTargetSoulPoints = targeter.soulPoints; let newTargetSlots = [...targeter.slots];

        if (card.type === CardType.DISCARD) {
            if (effectTargetSlotIndex !== undefined && newTargetSlots[effectTargetSlotIndex]) {
                newTargetDiscard.push(newTargetSlots[effectTargetSlotIndex]!.card);
                newTargetSlots[effectTargetSlotIndex] = null;
            } else if (newTargetHand.length > 0) {
                const ridx = Math.floor(Math.random() * newTargetHand.length);
                newTargetDiscard.push(newTargetHand.splice(ridx, 1)[0]);
            }
        } else if (card.type === CardType.MANIPULATION) {
            if (card.name === "Lockdown") {
                if (effectTargetSlotIndex !== undefined && !newTargetDisabledSlots.includes(effectTargetSlotIndex)) newTargetDisabledSlots.push(effectTargetSlotIndex);
            } else if (card.name === "Soul Drain") { if (newTargetSoulPoints > 0) { newTargetSoulPoints -= 1; stolenSouls = 1; } }
        } else if (card.type !== CardType.UTILITY) {
            newTargetBoard = newTargetBoard.map(char => {
                if (char.id === targetId || (card.type === CardType.TRAP && char.position === 0)) {
                     let newHealth = char.currentHealth; let isDead = char.isDead;
                     if (card.type === CardType.ATTACK || card.type === CardType.TRAP) {
                        let damage = (card.damage || 0);
                        if (char.statuses.some(s => s.type === StatusType.FRAGILE)) damage += 10;
                        if (activeCasterChar?.statuses.some(s => s.type === StatusType.WEAK)) damage = Math.max(0, damage - 10);
                        if (char.position === 0) {
                            if (char.name === 'Ashlen') damage -= 5; 
                            if (char.name === 'Vorg') damage -= 10;  
                            if (char.name === 'Ragnar' && card.type === CardType.ATTACK) reflectDamage = 5; 
                        }
                        newHealth = Math.max(0, char.currentHealth - Math.max(0, damage));
                        if (newHealth === 0 && !isDead) { killCount++; isDead = true; }
                        return { ...char, currentHealth: newHealth, isDead, statuses: card.applyStatus ? [...char.statuses, card.applyStatus] : char.statuses, animationState: 'hit' };
                     } else if (card.type === CardType.HEAL) {
                         let healAmt = Math.abs(card.damage || 0); if (hasSylphy) healAmt += 10;
                         return { ...char, currentHealth: Math.min(char.maxHealth, char.currentHealth + healAmt), animationState: 'heal' };
                     }
                } 
                return char;
            });
        }
        
        const newScore = caster.score + killCount;
        setCaster(prev => {
             let newState = { ...prev };
             if (card.name === "Equalizing Flow") newState.soulPoints = Math.floor((prev.soulPoints - cost + targeter.soulPoints) / 2);
             else newState.soulPoints = newState.soulPoints - cost + stolenSouls;
             if (slotIndex >= 0) { const ns = [...newState.slots]; ns[slotIndex] = null; newState.slots = ns; }
             else newState.hand = newState.hand.filter(c => c.id !== card.id);
             newState.discard = [...newState.discard, card];
             if (caster.id === targeter.id) { if (![CardType.UTILITY, CardType.MANIPULATION, CardType.INSTANT].includes(card.type)) newState.board = newTargetBoard; }
             else {
                if (casterIsNyx && card.type === CardType.ATTACK) { const a = newState.board.find(c => c.position === 0); if (a) { a.currentHealth = Math.min(a.maxHealth, a.currentHealth+10); a.animationState = 'heal'; } }
                if (reflectDamage > 0) { const a = newState.board.find(c => c.position === 0); if (a) { a.currentHealth = Math.max(0, a.currentHealth - reflectDamage); a.animationState = 'hit'; } }
             }
             if (["Soul Harvest", "Rapid Reflex"].includes(card.name)) newState = drawCard(newState, 2);
             if (card.name === "Focus") newState.soulPoints += 1;
             newState.score = newScore;
             return newState;
        });
        
        if (caster.id !== targeter.id) setTargeter(prev => ({ ...prev, board: newTargetBoard, hand: newTargetHand, discard: newTargetDiscard, disabledSlots: newTargetDisabledSlots, soulPoints: newTargetSoulPoints, slots: newTargetSlots }));
        
        setCastingSlot(null); setIsProcessing(false);
        setTimeout(() => {
            setTargeter(prev => ({ ...prev, board: prev.board.map(c => ({ ...c, animationState: undefined })) }));
            setCaster(prev => ({ ...prev, board: prev.board.map(c => ({ ...c, animationState: undefined })) }));
        }, 600);
        
        if (newScore >= MAX_SCORE || newTargetBoard.every(c => c.isDead)) {
            setPhase(GamePhase.GAME_OVER);
            addLog(caster.id === 'player' ? "VICTORY!" : "DEFEAT!", 'system');
            if (gameMode === GameMode.ONLINE && caster.id === 'player') socketService.sendAction({ actionType: 'GAME_OVER', data: { winnerId: caster.id } });
        }
    }, 700);
  };

  const endTurn = () => {
    if (isProcessing) return;
    setSelectedCardId(null);
    setPlayer(prev => ({ ...prev, isTurn: false, diceRolled: false, disabledSlots: [] }));
    setIsOpponentHandRevealed(false);
    setOpponent(prev => processTurnStart(drawCard(prev, DRAW_PER_TURN)));
    addLog("Ended Turn.", 'player');
    if (gameMode === GameMode.ONLINE) socketService.sendAction({ actionType: 'END_TURN', data: { handCount: player.hand.length } });
    setTimeout(() => { if (phaseRef.current !== GamePhase.GAME_OVER) { setPhase(GamePhase.OPPONENT_THINKING); setNotification("Opponent's Turn"); } }, 500);
  };

  useEffect(() => {
    if (gameMode === GameMode.AI && phase === GamePhase.OPPONENT_THINKING) {
      const runAI = async () => {
        await new Promise(r => setTimeout(r, 1000));
        if (phaseRef.current === GamePhase.GAME_OVER) return;
        setOpponent(prev => drawCard(prev, DRAW_PER_TURN));
        await new Promise(r => setTimeout(r, 1000));
        const roll = Math.floor(Math.random() * 3) + 1;
        setOpponent(prev => ({ ...prev, soulPoints: prev.soulPoints + roll, slots: prev.slots.map(s => s ? { ...s, isReady: true } : null) }));
        await new Promise(r => setTimeout(r, 1000));
        setOpponent(prev => {
            const active = prev.board.find(c => c.position === 0);
            return active?.statuses.some(s => s.type === StatusType.STUN) ? prev : { ...prev, board: rotateCharacters(prev.board) };
        });
        await new Promise(r => setTimeout(r, 1000));
        const updatedOpp = opponentRef.current;
        const playable = updatedOpp.slots.map((s, i) => ({ s, i })).filter(item => item.s && item.s.isReady && item.s.card.cost <= updatedOpp.soulPoints && !updatedOpp.disabledSlots.includes(item.i));
        if (playable.length > 0) {
            const pick = playable[Math.floor(Math.random() * playable.length)];
            const card = pick.s!.card;
            let tid: string | undefined;
            if (card.type === CardType.ATTACK) tid = playerRef.current.board.find(c => c.position === 0 && !c.isDead)?.id;
            else if (card.type === CardType.HEAL) tid = updatedOpp.board.find(c => c.currentHealth < c.maxHealth && !c.isDead)?.id;
            if (tid) await new Promise(r => { executeSpell(updatedOpp, setOpponent, playerRef.current, setPlayer, card, tid!, pick.i); setTimeout(r, 1000); });
        }
        await new Promise(r => setTimeout(r, 1000));
        setOpponent(prev => {
            const ns = [...prev.slots]; const nh = [...prev.hand];
            for (let i = 0; i < ns.length; i++) { if (ns[i] === null && nh.length > 0 && !prev.disabledSlots.includes(i)) { const ci = nh.findIndex(c => c.type !== CardType.INSTANT); if (ci >= 0) { ns[i] = { instanceId: nh[ci].id, card: nh[ci], isReady: false }; nh.splice(ci, 1); } } }
            return { ...prev, slots: ns, hand: nh };
        });
        await new Promise(r => setTimeout(r, 2000));
        setOpponent(prev => ({ ...prev, disabledSlots: [] }));
        setPlayer(prev => processTurnStart(drawCard(prev, DRAW_PER_TURN)));
        setTurnCount(prev => prev + 1); setPhase(GamePhase.ROLL_PHASE); setShowDiceOverlay(true);
      };
      runAI();
    }
  }, [phase, gameMode]);

  if (phase === GamePhase.START) return <><StartScreen onStart={startGame} onStartOnline={startOnlineGame} onOpenLibrary={() => setShowCardLibrary(true)} onOpenDeckBuilder={() => setPhase(GamePhase.DECK_BUILDING)} />{showCardLibrary && <CardLibraryModal onClose={() => setShowCardLibrary(false)} />}</>;
  if (phase === GamePhase.DECK_BUILDING) return <DeckBuilderScreen onBack={() => setPhase(GamePhase.START)} onStartGame={(deck, chars) => startGame(player.name, deck, chars)} />;

  return (
    <div className="w-full h-screen bg-black text-amber-100 overflow-hidden flex flex-col relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      {gameMode === GameMode.ONLINE && (
          <div className="absolute top-2 left-2 z-50 flex items-center gap-2 bg-neutral-900/80 px-2 py-1 rounded border border-neutral-700">
              {phase === GamePhase.WAITING_FOR_OPPONENT ? <WifiOff size={14} className="text-red-500 animate-pulse" /> : <Wifi size={14} className="text-green-500" />}
              <span className="text-[10px] uppercase font-bold text-neutral-400">{phase === GamePhase.WAITING_FOR_OPPONENT ? "Connecting..." : "Online"}</span>
          </div>
      )}
      {(phase === GamePhase.ROLL_PHASE || phase === GamePhase.MAIN_PHASE || phase === GamePhase.OPPONENT_THINKING) && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-black/40 px-3 py-1 rounded-full border border-yellow-900/30 flex items-center gap-2">
             <Clock size={14} className="text-yellow-600" />
             <span className="text-xs font-fantasy tracking-widest text-yellow-200/80">{formatTime(gameTime)}</span>
          </div>
      )}
      <div className="flex-1 flex flex-col">
          <TopBar 
            opponent={opponent} isLockdownActive={selectedCardId !== null && (player.slots.find(s => s && s.card.id === selectedCardId)?.card.name === "Lockdown" || player.slots.find(s => s && s.card.id === selectedCardId)?.card.type === CardType.DISCARD)} selectedCardId={selectedCardId}
            playerSlotWithCardId={(id) => player.slots.find(s => s && s.card.id === id)} castingSlotIndex={castingSlot?.playerId === 'opponent' ? castingSlot.slotIndex : null}
            onToggleLog={() => setShowLog(!showLog)} showLog={showLog} onOpenSettings={() => setShowSettings(true)}
            onPlayerTargetClick={handlePlayerTargetClick} onOpponentSlotClick={handleOpponentSlotClick}
            onCharacterClick={handleTargetClick} isValidTarget={isCharacterValidTarget} onInspectCard={(c) => setInspectedItem(c)}
            isOpponentHandRevealed={isOpponentHandRevealed}
          />
      </div>
      <div className="absolute top-1/2 left-0 w-full transform -translate-y-1/2 flex items-center justify-between px-2 md:px-16 lg:px-64 z-40 pointer-events-none">
          <div className={`absolute bottom-40 left-2 md:left-8 md:bottom-48 flex flex-col items-start gap-2 pointer-events-auto z-50 transition-opacity duration-500 ${notification ? 'opacity-100' : 'opacity-0'}`}>
                <div className={`px-4 md:px-6 py-2 border-l-4 text-xs md:text-sm font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all backdrop-blur-md ${player.isTurn ? 'bg-neutral-900/80 border-l-yellow-500 text-yellow-100 border-neutral-800' : 'bg-red-950/80 border-l-red-500 text-red-100 border-red-900'}`}>{notification || "..."}</div>
                {phase === GamePhase.OPPONENT_THINKING && (<div className="flex items-center gap-2 animate-pulse bg-black/60 px-3 py-1 border border-red-900/50 backdrop-blur-sm"><RotateCw className="animate-spin text-red-600 w-3 h-3 md:w-4 md:h-4" /><span className="text-[10px] text-red-400 uppercase tracking-widest">Enemy Turn</span></div>)}
           </div>
           <div className="w-full flex justify-between items-center pointer-events-none px-4 md:px-0">
              <div className="pointer-events-auto">
                   <div className={`relative group transition-all duration-300 ${player.isTurn ? 'scale-90 md:scale-110' : 'scale-75 md:scale-100 opacity-70'}`}>
                      <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center soul-pulse relative">
                          <div className="absolute inset-0 bg-neutral-900 rotate-45 border-2 border-yellow-600 shadow-xl"></div>
                          <div className="relative z-10 flex flex-col items-center"><Ghost size={20} className="text-yellow-500 md:w-7 md:h-7" /><span className="text-lg md:text-2xl font-fantasy text-white font-bold leading-none mt-0.5 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">{player.soulPoints}</span></div>
                      </div>
                      {player.isTurn && phase === GamePhase.MAIN_PHASE && (<button onClick={buyCardWithSouls} disabled={player.soulPoints < 2} className={`absolute -right-2 top-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center border border-neutral-900 shadow-lg transition-all z-20 ${player.soulPoints >= 2 ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:scale-110' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`} style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}><Plus size={14} strokeWidth={4} /></button>)}
                   </div>
              </div>
              <div className="pointer-events-auto">
                  <button onClick={endTurn} disabled={!player.isTurn || !player.diceRolled || isProcessing} className={`group w-14 h-14 md:w-20 md:h-20 flex flex-col items-center justify-center transition-all duration-300 relative ${!player.isTurn || !player.diceRolled || isProcessing ? 'opacity-50 grayscale cursor-not-allowed scale-90' : 'hover:scale-105 cursor-pointer'}`}>
                      <div className={`absolute inset-0 bg-neutral-900 border-2 border-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.3)] rotate-45 transition-colors ${player.isTurn && player.diceRolled ? 'group-hover:bg-orange-900/30 group-hover:border-orange-400' : ''}`}></div>
                      <div className="relative z-10 flex flex-col items-center"><Swords size={18} className={`mb-1 text-orange-500 md:w-6 md:h-6`} /><span className="text-[8px] md:text-[10px] font-bold uppercase leading-none text-orange-100">End<br/>Turn</span></div>
                  </button>
              </div>
           </div>
      </div>
      <PlayerHUD 
        player={player} phase={phase} selectedCardId={selectedCardId} castingSlotIndex={castingSlot?.playerId === 'player' ? castingSlot.slotIndex : null} burningSlotIndex={burningSlotIndex}
        getEffectiveCost={(c) => getEffectiveCost(c, player)} onCharacterClick={handleTargetClick} isValidTarget={isCharacterValidTarget}
        onDragOver={handleDragOver} onDrop={handleDrop} onSlotCardClick={handleSlotCardClick} onBurnCard={burnCardInSlot}
        onInspectCard={(c) => setInspectedItem(c)} onResetPlacedSpells={resetPlacedSpells} onHandCardClick={handleHandCardClick} onDragStart={handleDragStart} onLogDeck={() => addLog(`Deck: ${player.deck.length} cards remaining.`, 'player')}
      />
      {phase === GamePhase.GAME_OVER && <GameOverScreen score={player.score} notification={notification} onReset={resetGame} onGoHome={() => setPhase(GamePhase.START)} />}
      <GameLog logs={gameLog} show={showLog} onClose={() => setShowLog(false)} />
      {showSettings && <SettingsModal onConcede={() => { setPhase(GamePhase.GAME_OVER); setOpponent(p => ({...p, score: MAX_SCORE})); if(gameMode === GameMode.ONLINE) socketService.sendAction({actionType: 'CONCEDE', data: {}}); }} onResume={() => setShowSettings(false)} onOpenLibrary={() => { setShowSettings(false); setShowCardLibrary(true); }} />}
      {showCardLibrary && <CardLibraryModal onClose={() => setShowCardLibrary(false)} />}
      {inspectedItem && <InspectionModal item={inspectedItem} onClose={() => setInspectedItem(null)} />}
      {showDiceOverlay && <DiceOverlay isRolling={isRollingDice} result={diceResult} onRoll={performDiceRoll} />}
      {gameMode === GameMode.ONLINE && phase === GamePhase.WAITING_FOR_OPPONENT && (
          <div className="absolute inset-0 z-[100] bg-black/90 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <Wifi className="w-10 h-10 text-yellow-500 animate-pulse" />
                  <h2 className="text-2xl font-fantasy text-yellow-100">Searching for Opponent...</h2>
                  <button onClick={resetGame} className="mt-8 text-red-500 border border-red-900 px-6 py-2 hover:bg-red-900/20 rounded uppercase text-xs font-bold tracking-widest">Cancel</button>
              </div>
          </div>
      )}
      {selectedCardId && (<div className="absolute inset-0 z-10 pointer-events-none bg-black/40 flex items-center justify-center"><div className="mt-[100px] text-yellow-100 animate-bounce font-bold tracking-widest bg-neutral-900 border border-yellow-600/50 px-6 py-3 shadow-[0_0_20px_rgba(234,179,8,0.3)] text-sm md:text-base backdrop-blur-sm">SELECT TARGET</div></div>)}
    </div>
  );
};

export default App;