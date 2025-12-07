
import React, { useState, useEffect, useRef } from 'react';
import { Card, Character, PlayerState, GamePhase, CardType, LogEntry, LogType, StatusType, StatusEffect, GameMode, OnlineActionPayload, SocketMessage } from './types';
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

// Utility for deep cloning to avoid mutation issues
const deepClone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj));

const MAX_HAND_SIZE = 10;
const DRAW_PER_TURN = 2; // Updated Rule: Draw 2 cards per turn

const App: React.FC = () => {
  // --- Game State ---
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.AI);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.START);
  const [turnCount, setTurnCount] = useState<number>(1);
  const [gameTime, setGameTime] = useState<number>(0);
  
  // Ref to track phase synchronously for AI timeouts
  const phaseRef = useRef<GamePhase>(GamePhase.START);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  const [notification, setNotification] = useState<string>("");
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Log State
  const [gameLog, setGameLog] = useState<LogEntry[]>([]);
  const [showLog, setShowLog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCardLibrary, setShowCardLibrary] = useState(false); 

  // Animation State
  const [castingSlot, setCastingSlot] = useState<{playerId: string, slotIndex: number} | null>(null);
  const [burningSlotIndex, setBurningSlotIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New State for Eagle Eye Instant Spell
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

  // Refs for State Access in Async AI/Socket Logic
  const playerRef = useRef(player);
  const opponentRef = useRef(opponent);

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { opponentRef.current = opponent; }, [opponent]);

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  
  // Dice Overlay State
  const [showDiceOverlay, setShowDiceOverlay] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRollingDice, setIsRollingDice] = useState(false);

  // Inspect Modal State
  const [inspectedItem, setInspectedItem] = useState<Card | Character | null>(null);

  // --- Helpers ---

  // Timer Effect
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

  // Wrapper to update log and notification
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
        
        // Decrement status duration and apply DOTs
        const newStatuses = char.statuses.map(s => {
            if (s.type === StatusType.BURN && s.value) {
                newHealth = Math.max(0, newHealth - s.value);
                animationState = 'hit';
            }
            return { ...s, duration: s.duration - 1 };
        }).filter(s => s.duration > 0);

        return { ...char, currentHealth: newHealth, statuses: newStatuses, animationState };
    });
    
    // Check for DOT deaths
    newBoard.forEach(c => {
        if (c.currentHealth === 0 && !c.isDead) {
            c.isDead = true;
        }
    });

    return { ...p, board: newBoard };
  };

  const buyCardWithSouls = () => {
      if (isProcessing || !player.isTurn || phase !== GamePhase.MAIN_PHASE || player.soulPoints < 2) return;
      
      const newSoulPoints = player.soulPoints - 2;
      
      setPlayer(prev => {
          const withDeduction = { ...prev, soulPoints: newSoulPoints };
          return drawCard(withDeduction, 1);
      });
      addLog("Sacrificed 2 Soul Points for a card!", 'player');
      
      if (gameMode === GameMode.ONLINE) {
          // Send the specific calculated SP to avoid drift
          socketService.sendAction({ actionType: 'BUY_CARD', data: { currentSoulPoints: newSoulPoints } });
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
                   socketService.sendAction({ actionType: 'RESET_SLOTS', data: {} });
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
    // STUN no longer disables passive
    
    if (lyra && card.cost > 1) {
        return Math.max(1, card.cost - 1);
    }
    return card.cost;
  };

  // --- Actions ---

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
      setPlayer({ ...player, score: 0, soulPoints: 0, hand: [], slots: Array(6).fill(null), disabledSlots: [], deck: [], discard: [], lastPlayedCard: null, board: deepClone(INITIAL_CHARACTERS_PLAYER), isTurn: true, diceRolled: false });
      setOpponent({ ...opponent, score: 0, soulPoints: 0, hand: [], slots: Array(6).fill(null), disabledSlots: [], deck: [], discard: [], lastPlayedCard: null, board: deepClone(INITIAL_CHARACTERS_OPPONENT), isTurn: false, diceRolled: false });
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
    if (customDeck) {
        for (let i = initialPlayerDeck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [initialPlayerDeck[i], initialPlayerDeck[j]] = [initialPlayerDeck[j], initialPlayerDeck[i]];
        }
    }
    const initialOpponentDeck = generateDeck(30);

    let initialPlayer = { ...player, deck: initialPlayerDeck, lastPlayedCard: null };
    if (customCharacters) {
        initialPlayer.board = customCharacters.map((c, idx) => ({ ...c, position: idx as 0 | 1 | 2, currentHealth: c.maxHealth, isDead: false, statuses: [] }));
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

  const startGame = (customDeck?: Card[], customCharacters?: Character[]) => {
    setupBoardState(customDeck, customCharacters);
    setPhase(GamePhase.ROLL_PHASE);
    setShowDiceOverlay(true);
    addLog("Match Started! Roll the Soul Dice.", 'system');
  };
  
  const startOnlineGame = (roomId: string) => {
      setGameMode(GameMode.ONLINE);
      setupBoardState();
      setPhase(GamePhase.WAITING_FOR_OPPONENT);
      addLog(`Connecting to Room: ${roomId}...`, 'system');
      
      socketService.connect(roomId, player.name, 
        () => {
            addLog("Connected to lobby. Waiting for response...", 'system');
        },
        (err) => {
            addLog(err, 'system');
            setTimeout(resetGame, 3000);
        }
      );
  };

  // --- SOCKET HANDLER EFFECT ---
  useEffect(() => {
    if (gameMode !== GameMode.ONLINE) return;

    const handleSocketMessage = (msg: SocketMessage) => {
        switch (msg.type) {
            case 'PLAYER_JOINED':
                // Someone else joined. I am the HOST (Player 1).
                // The server broadcasts this to everyone in the room except the sender.
                // So if I receive this, it means I was already here.
                if (msg.payload.name !== playerRef.current.name) {
                    addLog(`${msg.payload.name} joined! You are Player 1.`, 'system');
                    setOpponent(prev => ({ ...prev, name: msg.payload.name }));
                    
                    // Send WELCOME with my state to sync the newcomer
                    socketService.send({
                        type: 'WELCOME',
                        payload: { 
                            name: playerRef.current.name,
                            board: playerRef.current.board 
                        }
                    });

                    // I start first
                    setPlayer(prev => ({ ...prev, isTurn: true }));
                    setOpponent(prev => ({ ...prev, isTurn: false }));
                    setPhase(GamePhase.ROLL_PHASE);
                    setShowDiceOverlay(true);
                }
                break;

            case 'WELCOME':
                // I am the CLIENT (Player 2). Host acknowledged me.
                addLog(`Connected to Host: ${msg.payload.name}. Opponent starts first.`, 'system');
                
                // Update Opponent State from Host's data
                setOpponent(prev => ({ 
                    ...prev, 
                    name: msg.payload.name,
                    board: msg.payload.board // Sync their custom characters
                }));

                // Send my state back so Host knows my characters
                socketService.send({
                    type: 'SYNC_LOADOUT',
                    payload: { 
                        name: playerRef.current.name,
                        board: playerRef.current.board 
                    }
                });

                // I wait for my turn
                setPlayer(prev => ({ ...prev, isTurn: false }));
                setOpponent(prev => ({ ...prev, isTurn: true }));
                setPhase(GamePhase.OPPONENT_THINKING); 
                setNotification("Opponent's Turn");
                break;

            case 'SYNC_LOADOUT':
                // Host receiving Client's state (Response to Welcome)
                addLog(`Opponent synced loadout.`, 'system');
                setOpponent(prev => ({
                    ...prev,
                    name: msg.payload.name,
                    board: msg.payload.board
                }));
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
      // Execute the action using refs to ensure latest state access
      if (payload.actionType === 'ROLL_DICE') {
          const val = payload.data.value;
          setOpponent(prev => ({
              ...prev, 
              // Use synced soul points if available, else calculate
              soulPoints: payload.data.currentSoulPoints ?? (prev.soulPoints + (val || 0)),
              slots: prev.slots.map(s => s ? { ...s, isReady: true } : null)
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
                 if (slotIndex !== undefined && card) {
                     newSlots[slotIndex] = { instanceId: card.id, card, isReady: false };
                 }

                 // Remove from hand (visual simulation)
                 const newHand = [...prev.hand];
                 if (newHand.length > 0) newHand.shift(); // Remove first card

                 return { ...prev, slots: newSlots, hand: newHand };
             });
             addLog("Opponent set a card.", 'opponent');
      }
      else if (payload.actionType === 'RESET_SLOTS') {
             setOpponent(prev => {
                 const newSlots = [...prev.slots];
                 const newHand = [...prev.hand];
                 let count = 0;
                 for(let i=0; i<newSlots.length; i++) {
                     const s = newSlots[i];
                     if (s && !s.isReady) {
                         newHand.push(s.card);
                         newSlots[i] = null;
                         count++;
                     }
                 }
                 if (count > 0) {
                      addLog("Opponent returned spells to hand.", 'opponent');
                      return { ...prev, slots: newSlots, hand: newHand };
                 }
                 return prev;
             });
      }
      else if (payload.actionType === 'BUY_CARD') {
             setOpponent(prev => {
                 // Force sync if provided
                 const nextSoulPoints = payload.data.currentSoulPoints ?? (prev.soulPoints - 2);
                 const withDeduction = { ...prev, soulPoints: nextSoulPoints };
                 // Visually draw a card for opponent
                 return drawCard(withDeduction, 1);
             });
             addLog("Opponent sacrificed souls for a card.", 'opponent');
      }
      else if (payload.actionType === 'BURN_CARD') {
           setOpponent(prev => {
                const newSlots = [...prev.slots];
                const slotIndex = payload.data.slotIndex;
                const nextSoulPoints = payload.data.currentSoulPoints ?? (prev.soulPoints + 1);
                
                if(slotIndex !== undefined && newSlots[slotIndex]) {
                    newSlots[slotIndex] = null;
                    return { ...prev, slots: newSlots, soulPoints: nextSoulPoints };
                }
                return prev;
           });
           addLog("Opponent sacrificed a spell.", 'opponent');
      }
      else if (payload.actionType === 'CONCEDE') {
           setPhase(GamePhase.GAME_OVER);
           setPlayer(prev => ({...prev, score: MAX_SCORE})); // Player wins
           addLog("Opponent Surrendered!", 'system');
           socketService.disconnect();
      }
      else if (payload.actionType === 'GAME_OVER') {
           // Opponent broadcasted Game Over (which implies I won, or they won?)
           // If opponent sends GAME_OVER with their ID as winner, I lost.
           if (payload.data.winnerId === opponentRef.current.id) {
               setPhase(GamePhase.GAME_OVER);
               setOpponent(prev => ({...prev, score: MAX_SCORE}));
               addLog("DEFEAT! Your party has fallen.", 'system');
           }
      }
      else if (payload.actionType === 'CAST_SPELL') {
          const { card, targetId, slotIndex, effectTargetSlotIndex, currentSoulPoints } = payload.data;
          if (card) {
             // If slotIndex is -1 or undefined, it's an instant or hand cast
             executeSpell(opponentRef.current, setOpponent, playerRef.current, setPlayer, card, targetId || '', slotIndex ?? -1, effectTargetSlotIndex);
             
             // Force Sync Opponent Soul Points AFTER the spell executes to correct drift
             if (currentSoulPoints !== undefined) {
                 setTimeout(() => {
                     setOpponent(prev => ({ ...prev, soulPoints: currentSoulPoints }));
                 }, 800); // Wait for spell anims
             }
          }
      }
      else if (payload.actionType === 'END_TURN') {
          addLog("Opponent ended turn.", 'opponent');
          setIsOpponentHandRevealed(false); // Reset Eagle Eye effect on turn end
          setOpponent(prev => ({ ...prev, disabledSlots: [] }));
          
          // Start Player Turn
          setPlayer(prev => {
             // UPDATE: Draw 2 Cards
             const p = drawCard(prev, DRAW_PER_TURN);
             const processedP = processTurnStart(p);
             
             // CHECK IF I DIED FROM DOTS at start of my turn
             const allDead = processedP.board.every(c => c.isDead);
             if (allDead) {
                 setTimeout(() => {
                     setPhase(GamePhase.GAME_OVER);
                     // I lost, so Opponent (who just ended turn) wins.
                     setOpponent(o => ({...o, score: MAX_SCORE}));
                     addLog("DEFEAT! Your party has fallen.", 'system');
                     
                     // Broadcast Game Over to Opponent
                     if(gameMode === GameMode.ONLINE) {
                          socketService.sendAction({ actionType: 'GAME_OVER', data: { winnerId: opponentRef.current.id } });
                     }

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

  const concedeMatch = () => {
    setPhase(GamePhase.GAME_OVER);
    setOpponent(prev => ({...prev, score: MAX_SCORE})); 
    addLog("Player Conceded the match.", 'system');
    setShowSettings(false);
    if (gameMode === GameMode.ONLINE) {
        socketService.sendAction({ actionType: 'CONCEDE', data: {} });
        setTimeout(() => socketService.disconnect(), 100);
    }
  };

  const performDiceRoll = () => {
    if (isRollingDice || diceResult !== null) return;
    setIsRollingDice(true);
    
    setTimeout(() => {
        const value = Math.floor(Math.random() * 3) + 1;
        setDiceResult(value);
        setIsRollingDice(false);
        
        // Use functional update to ensure we have latest state
        setPlayer(prev => {
            const nextSoulPoints = prev.soulPoints + value;

            // Send Sync Data
            if (gameMode === GameMode.ONLINE) {
                socketService.sendAction({ 
                    actionType: 'ROLL_DICE', 
                    data: { value, currentSoulPoints: nextSoulPoints } 
                });
            }

            // Logic for rotation / stun
            const activeChar = prev.board.find(c => c.position === 0);
            const isStunned = activeChar?.statuses.some(s => s.type === StatusType.STUN);
            let newBoard = prev.board;

            if (isStunned) {
                addLog("Active Character Stunned! Rotation Locked.", 'system');
            } else {
                newBoard = rotateCharacters(prev.board);
                if (gameMode === GameMode.ONLINE) {
                     // We don't really need a separate ROTATE action if we are syncing everything, 
                     // but keeping it for visual consistency if needed by receiver logic. 
                     // The receiver logic for ROLL_DICE doesn't rotate, so we send it.
                     const activeCharCheck = prev.board.find(c => c.position === 0);
                     if (!activeCharCheck?.statuses.some(s => s.type === StatusType.STUN)) {
                         socketService.sendAction({ actionType: 'ROTATE', data: {} });
                     }
                }
            }

            return {
                ...prev,
                soulPoints: nextSoulPoints, 
                diceRolled: true,
                board: newBoard,
                slots: prev.slots.map(s => s ? { ...s, isReady: true } : null),
            };
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
          if (player.disabledSlots.includes(targetSlotIndex)) {
              addLog("Slot is DISABLED!", 'system');
              return;
          }
          if (player.slots[targetSlotIndex] === null) slotIndex = targetSlotIndex;
          else { addLog("Slot is occupied!", 'system'); return; }
      } else {
          slotIndex = player.slots.findIndex((s, idx) => s === null && !player.disabledSlots.includes(idx));
      }

      if (slotIndex === -1) { addLog("No available slots!", 'system'); return; }

      setPlayer(prev => {
          const newSlots = [...prev.slots];
          newSlots[slotIndex] = { instanceId: card.id, card: card, isReady: false };
          return { ...prev, slots: newSlots, hand: prev.hand.filter(c => c.id !== card.id) };
      });
      
      if (gameMode === GameMode.ONLINE) {
           socketService.sendAction({ actionType: 'PLACE_CARD', data: { card, slotIndex } });
      }

      addLog(`Set ${card.name} in Slot ${slotIndex + 1}.`, 'player');
  };

  const burnCardInSlot = (e: React.MouseEvent, slotIndex: number) => {
      e.stopPropagation(); 
      if (isProcessing || !player.slots[slotIndex]) return;
      const slot = player.slots[slotIndex]!;
      if (!slot.isReady) { addLog("Can only sacrifice active spells!", 'system'); return; }
      
      const card = slot.card;
      setBurningSlotIndex(slotIndex);
      setIsProcessing(true);
      
      // Calculate next value immediately for sync
      const nextSoulPoints = player.soulPoints + 1;
      
      if (gameMode === GameMode.ONLINE) {
          socketService.sendAction({ actionType: 'BURN_CARD', data: { slotIndex, currentSoulPoints: nextSoulPoints } });
      }
      
      setTimeout(() => {
          setPlayer(prev => {
              const newSlots = [...prev.slots];
              newSlots[slotIndex] = null;
              return { ...prev, slots: newSlots, soulPoints: nextSoulPoints, discard: [...prev.discard, card] };
          });
          addLog(`Sacrificed ${card.name} for +1 Soul Point.`, 'player');
          setBurningSlotIndex(null);
          setIsProcessing(false);
      }, 700);
  };

  // --- Drag & Drop ---
  const handleDragStart = (e: React.DragEvent, card: Card) => { e.dataTransfer.setData("cardId", card.id); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; };
  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
      e.preventDefault();
      if (isProcessing || phase !== GamePhase.MAIN_PHASE || !player.isTurn) return;
      const cardId = e.dataTransfer.getData("cardId");
      const card = player.hand.find(c => c.id === cardId);
      if (card) {
          if (card.type === CardType.INSTANT) {
              addLog("Instant spells cannot be placed in slots!", "system");
          } else {
              placeCardInSlot(card, slotIndex);
          }
      }
  };
  
  // Update handleHandCardClick to support Instant Spells
  const handleHandCardClick = (card: Card) => { 
      if (phase !== GamePhase.MAIN_PHASE || !player.isTurn || isProcessing) return;
      
      if (card.type === CardType.INSTANT) {
          const cost = getEffectiveCost(card, player);
          if (player.soulPoints < cost) {
              addLog("Not enough Soul Points!", 'system');
              return;
          }
          // Instant spells are executed directly from hand
          handleSpellExecution(player, setPlayer, opponent, setOpponent, card, '', -1); 
      } else {
          placeCardInSlot(card); 
      }
  };

  const handleSlotCardClick = (slotIndex: number) => {
    if (isProcessing || phase !== GamePhase.MAIN_PHASE || !player.isTurn) return;
    if (player.disabledSlots.includes(slotIndex)) { addLog("Slot is DISABLED!", 'system'); return; }
    const slot = player.slots[slotIndex];
    if (!slot || !slot.isReady) { if(slot) addLog("Spell is preparing...", 'system'); return; }

    const card = slot.card;
    const cost = getEffectiveCost(card, player);
    if (player.soulPoints < cost) { addLog("Not enough Soul Points!", 'system'); return; }
    
    // Auto-target spells
    if (["Soul Harvest", "Soul Infusion", "Greed", "Focus", "Preparation", "Clairvoyance", "Spell Shatter", "Equalizing Flow", "Rapid Reflex", "Unstable Rift", "Eagle Eye"].includes(card.name)) { 
        handleSpellExecution(player, setPlayer, player, setPlayer, card, player.id, slotIndex); 
        return; 
    }
    if (["Mind Rot", "Soul Drain"].includes(card.name)) { 
        handleSpellExecution(player, setPlayer, opponent, setOpponent, card, opponent.id, slotIndex); 
        return; 
    }

    if (selectedCardId === card.id) setSelectedCardId(null);
    else {
      setSelectedCardId(card.id);
      let msg = "";
      if (card.type === CardType.HEAL) msg = "Select an ally";
      else if (card.name === "Lockdown") msg = "Select enemy SPELL SLOT";
      else msg = "Select an enemy";
      addLog(`${msg} ${card.canTargetBackline ? "(Any Position)" : "(Front Only)"}`, 'system');
    }
  };

  const handleOpponentSlotClick = (targetSlotIndex: number) => {
      if (isProcessing || !selectedCardId) return;
      const playerSlotIndex = player.slots.findIndex(s => s && s.card.id === selectedCardId);
      if (playerSlotIndex === -1) return;
      const card = player.slots[playerSlotIndex]!.card;
      if (card.name !== "Lockdown") return;

      if (opponent.disabledSlots.includes(targetSlotIndex)) { addLog("Already disabled!", 'system'); return; }
      handleSpellExecution(player, setPlayer, opponent, setOpponent, card, opponent.id, playerSlotIndex, targetSlotIndex);
      setSelectedCardId(null);
  };

  const isCharacterValidTarget = (char: Character, isEnemy: boolean): boolean => {
      if (!selectedCardId) return false;
      const slot = player.slots.find(s => s && s.card.id === selectedCardId);
      if (!slot) return false;
      const card = slot.card;

      if (card.type === CardType.ATTACK && !isEnemy) return false;
      if (card.type === CardType.HEAL && isEnemy) return false;
      if (card.type === CardType.DISCARD || card.type === CardType.MANIPULATION || card.type === CardType.INSTANT) return false; 
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
    if (card.name === "Lockdown") return;
    if (card.type === CardType.ATTACK && target.position !== 0 && !card.canTargetBackline) { addLog("Target Frontline Only!", 'system'); return; }

    const targetState = isEnemy ? opponent : player;
    const setTargetState = isEnemy ? setOpponent : setPlayer;
    handleSpellExecution(player, setPlayer, targetState, setTargetState, card, target.id, slotIndex);
    setSelectedCardId(null);
  };

  const handlePlayerTargetClick = (isOpponent: boolean) => {
      if (isProcessing || !selectedCardId) return;
      const slotIndex = player.slots.findIndex(s => s && s.card.id === selectedCardId);
      if (slotIndex === -1) return;
      const card = player.slots[slotIndex]!.card;
      if (card.name === "Lockdown") return;
      if ((card.type === CardType.DISCARD || card.type === CardType.MANIPULATION) && isOpponent) {
          handleSpellExecution(player, setPlayer, opponent, setOpponent, card, opponent.id, slotIndex);
          setSelectedCardId(null);
      }
  };

  // Wrapper to handle Online emitting vs Local execution
  const handleSpellExecution = (
    caster: PlayerState, setCaster: React.Dispatch<React.SetStateAction<PlayerState>>, 
    targeter: PlayerState, setTargeter: React.Dispatch<React.SetStateAction<PlayerState>>, 
    card: Card, targetId: string, slotIndex: number, effectTargetSlotIndex?: number
  ) => {
      // Execute locally for UI feedback
      executeSpell(caster, setCaster, targeter, setTargeter, card, targetId, slotIndex, effectTargetSlotIndex);

      // If online and I am casting, tell the opponent
      if (gameMode === GameMode.ONLINE && caster.id === 'player') {
          // Calculate expected SP after cast to sync with opponent
          const cost = getEffectiveCost(card, caster);
          let nextSP = caster.soulPoints - cost;
          if (card.name === "Equalizing Flow") {
              const total = (caster.soulPoints - cost) + targeter.soulPoints;
              nextSP = Math.floor(total / 2);
          } else if (card.name === "Soul Drain") {
              nextSP += 1; // Assuming stealing 1
          } else if (card.name === "Focus") nextSP += 1;
          else if (card.name === "Preparation" || card.name === "Soul Infusion") nextSP += 2;
          
          socketService.sendAction({ 
              actionType: 'CAST_SPELL', 
              data: { card, targetId, slotIndex, effectTargetSlotIndex, currentSoulPoints: nextSP } 
          });
      }
  };

  const executeSpell = (
    caster: PlayerState, setCaster: React.Dispatch<React.SetStateAction<PlayerState>>, 
    targeter: PlayerState, setTargeter: React.Dispatch<React.SetStateAction<PlayerState>>, 
    card: Card, targetId: string, slotIndex: number, effectTargetSlotIndex?: number
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // If slotIndex is >= 0, it comes from a slot. If -1, it's an Instant from hand.
    if (slotIndex >= 0) {
        setCastingSlot({ playerId: caster.id, slotIndex });
    }
    
    addLog(`${caster.name} cast ${card.name}!`, caster.id === 'player' ? 'player' : 'opponent');

    setTimeout(() => {
        const activeCasterChar = caster.board.find(c => c.position === 0);
        
        // Passives logic
        const hasSylphy = caster.board.some(c => c.name === 'Sylphy' && !c.isDead && c.position === 0);
        const casterIsNyx = activeCasterChar?.name === 'Nyx' && !activeCasterChar.isDead;
    
        const cost = getEffectiveCost(card, caster);
        const animType = card.type === CardType.HEAL ? 'heal' : 'hit';
    
        let killCount = 0;
        let reflectDamage = 0; 
        let stolenSouls = 0;
        
        let newTargetBoard = deepClone(targeter.board);
        let newTargetHand = [...targeter.hand];
        let newTargetDiscard = [...targeter.discard];
        let newTargetDisabledSlots = [...targeter.disabledSlots];
        let newTargetSoulPoints = targeter.soulPoints;
        let newTargetSlots = [...targeter.slots]; // For Spell Shatter

        // -- INSTANT SPELL LOGIC --
        if (card.type === CardType.INSTANT) {
            // New Spells Logic
            if (card.name === "Spell Shatter") {
                // Destroy 2 opponent's spells
                let occupiedIndices = newTargetSlots.map((s, i) => s ? i : -1).filter(i => i !== -1);
                if (occupiedIndices.length > 0) {
                    // Pick up to 2 random
                    const toDestroy: number[] = [];
                    for(let i=0; i<2; i++) {
                         if (occupiedIndices.length === 0) break;
                         const randIdx = Math.floor(Math.random() * occupiedIndices.length);
                         toDestroy.push(occupiedIndices[randIdx]);
                         occupiedIndices.splice(randIdx, 1);
                    }
                    toDestroy.forEach(idx => {
                        newTargetSlots[idx] = null;
                    });
                }
            } else if (card.name === "Equalizing Flow") {
                // Combine soul points and split
                const totalSp = caster.soulPoints + targeter.soulPoints - cost; // Pay cost first? Cost is paid below. 
                // Wait, cost is paid from caster inside setCaster. 
                // We should calculate total based on "Pre-Cost Caster SP - Cost + Target SP". 
                // The caster state update happens later. Let's do calculation here.
                const casterRemaining = caster.soulPoints - cost;
                const combined = casterRemaining + targeter.soulPoints;
                const split = Math.floor(combined / 2);
                newTargetSoulPoints = split;
                // Caster SP will be set in setCaster below to `split` (special handling needed)
            } else if (card.name === "Rapid Reflex") {
                // Draw 2 instantly
                // Handled in setCaster logic as this is a self-buff utility
            } else if (card.name === "Unstable Rift") {
                // Discard both hands and draw 3
                newTargetDiscard.push(...newTargetHand);
                newTargetHand = [];
                // Target Draws 3
                // Need a way to simulate draw for opponent safely or reuse draw logic
                // Since this is inside executeSpell, we have to manipulate the arrays manually or trigger helper
                // Reusing generic logic:
                // ...
            } else if (card.name === "Eagle Eye") {
                // Reveal opponent hand
                if (caster.id === 'player') {
                    setIsOpponentHandRevealed(true);
                    setTimeout(() => setIsOpponentHandRevealed(false), 5000);
                }
                // If opponent uses it, visually we can't show "player hand" to them on this screen, but we can log it.
            }

        } else if (card.type === CardType.DISCARD) {
            if (newTargetHand.length > 0) {
                const ridx = Math.floor(Math.random() * newTargetHand.length);
                newTargetDiscard.push(newTargetHand.splice(ridx, 1)[0]);
            }
        } else if (card.type === CardType.MANIPULATION) {
            if (card.name === "Lockdown") {
                if (typeof effectTargetSlotIndex === 'number' && !newTargetDisabledSlots.includes(effectTargetSlotIndex)) {
                    newTargetDisabledSlots.push(effectTargetSlotIndex);
                } else {
                    const possibleSlots = [0, 1, 2, 3, 4, 5].filter(i => !newTargetDisabledSlots.includes(i));
                    if (possibleSlots.length > 0) newTargetDisabledSlots.push(possibleSlots[Math.floor(Math.random() * possibleSlots.length)]);
                }
            } else if (card.name === "Soul Drain") {
                 if (newTargetSoulPoints > 0) { newTargetSoulPoints -= 1; stolenSouls = 1; }
            } else if (card.name === "Overload") {
                 newTargetSoulPoints = Math.max(0, newTargetSoulPoints - 2);
            }
        } else if (card.type !== CardType.UTILITY) {
            newTargetBoard = newTargetBoard.map(char => {
                if (char.id === targetId || (card.type === CardType.TRAP && card.name === "Bear Trap")) {
                     let newHealth = char.currentHealth;
                     let newStatuses = [...char.statuses];
                     let isDead = char.isDead;
                     
                     if (card.type === CardType.ATTACK || card.type === CardType.TRAP) {
                        let damage = (card.damage || 0);
                        
                        // Status Multipliers
                        const isFragile = char.statuses.some(s => s.type === StatusType.FRAGILE);
                        const attackerWeak = activeCasterChar?.statuses.some(s => s.type === StatusType.WEAK);
                        
                        if (isFragile) damage += 10;
                        if (attackerWeak) damage = Math.max(0, damage - 10);
                        
                        // Defensive Passives
                        if (char.position === 0) {
                            if (char.name === 'Ashlen') damage -= 5; 
                            if (char.name === 'Vorg') damage -= 10;  
                            if (char.name === 'Ragnar' && card.type === CardType.ATTACK) reflectDamage = 5; 
                        }

                        damage = Math.max(0, damage);
                        newHealth = Math.max(0, char.currentHealth - damage);
                        if (newHealth === 0 && !isDead) { killCount++; isDead = true; }
                        
                        // Apply Status from Card
                        if (card.applyStatus) {
                            newStatuses.push({ ...card.applyStatus });
                        }

                     } else if (card.type === CardType.HEAL) {
                         let healAmt = Math.abs(card.damage || 0);
                         if (hasSylphy) healAmt += 10;
                         newHealth = Math.min(char.maxHealth, char.currentHealth + healAmt);
                     }
        
                     return { ...char, currentHealth: newHealth, isDead, statuses: newStatuses, animationState: animType };
                } 
                return char;
            });
        }
    
        const newScore = caster.score + killCount;
        const isTargetWipedOut = newTargetBoard.every(c => c.isDead);
        const isGameOver = newScore >= MAX_SCORE || isTargetWipedOut;
    
        // --- APPLY UPDATES TO CASTER ---
        setCaster(prev => {
             let newState = { ...prev };
             // Handle Cost
             if (card.name === "Equalizing Flow") {
                  // Special Case: SP set to split amount (calculated from pre-cost values)
                  const total = (prev.soulPoints - cost) + targeter.soulPoints;
                  newState.soulPoints = Math.floor(total / 2);
             } else {
                  newState.soulPoints = newState.soulPoints - cost + stolenSouls;
             }
             
             // Remove from Slot OR Hand (if Instant)
             if (slotIndex >= 0) {
                 const newSlots = [...newState.slots]; 
                 newSlots[slotIndex] = null; 
                 newState.slots = newSlots;
             } else {
                 // Removed from Hand (Instant)
                 newState.hand = newState.hand.filter(c => c.id !== card.id);
             }

             // Add to discard
             newState.discard = [...newState.discard, card];

             // Self-Targeting or Board Updates if self-cast
             if (caster.id === targeter.id) {
                if (card.type !== CardType.UTILITY && card.type !== CardType.MANIPULATION && card.type !== CardType.INSTANT) {
                    newState.board = newTargetBoard; 
                }
             } else {
                // If Nyx passive or reflect damage, update board
                if (casterIsNyx && card.type === CardType.ATTACK) {
                    const active = newState.board.find(c => c.position === 0);
                    if (active) { active.currentHealth = Math.min(active.maxHealth, active.currentHealth + 10); active.animationState = 'heal'; }
                }
                if (reflectDamage > 0) {
                     const active = newState.board.find(c => c.position === 0);
                     if (active) { active.currentHealth = Math.max(0, active.currentHealth - reflectDamage); active.animationState = 'hit'; }
                }
             }

             // Utility/Instant Card Logic (Self Buffs)
             if (card.name === "Soul Harvest" || card.name === "Rapid Reflex") newState = drawCard(newState, 2);
             if (card.name === "Greed") newState = drawCard(newState, 3);
             if (card.name === "Clairvoyance") newState = drawCard(newState, 1);
             if (card.name === "Focus") newState.soulPoints += 1;
             if (card.name === "Preparation" || card.name === "Soul Infusion") newState.soulPoints += 2;
             
             if (card.name === "Unstable Rift") {
                 // Discard Hand & Draw 3
                 newState.discard = [...newState.discard, ...newState.hand]; // Hand already filtered of played card above? Yes.
                 newState.hand = [];
                 newState = drawCard(newState, 3);
             }
             
             newState.score = newScore;
             return newState;
        });

        // --- APPLY UPDATES TO TARGETER ---
        if (caster.id !== targeter.id) {
            setTargeter(prev => {
                let next = { 
                    ...prev, 
                    board: newTargetBoard, 
                    hand: newTargetHand, 
                    discard: newTargetDiscard, 
                    disabledSlots: newTargetDisabledSlots, 
                    soulPoints: newTargetSoulPoints,
                    slots: newTargetSlots // For Spell Shatter
                };
                
                if (card.name === "Unstable Rift") {
                     // Target also discards hand and draws 3
                     // Since we modified newTargetHand/Discard above, we assume newTargetHand was cleared? 
                     // Wait, in the logic block above: newTargetDiscard.push(...newTargetHand); newTargetHand = [];
                     // So we just need to execute the draw here.
                     next = drawCard(next, 3);
                }
                return next;
            });
        }

        setCastingSlot(null);
        setIsProcessing(false);

        setTimeout(() => {
            setTargeter(prev => ({ ...prev, board: prev.board.map(c => ({ ...c, animationState: undefined })) }));
            if (caster.id !== targeter.id || reflectDamage > 0 || casterIsNyx) {
                 setCaster(prev => ({ ...prev, board: prev.board.map(c => ({ ...c, animationState: undefined })) }));
            }
        }, 600);
    
        if (isGameOver) {
            setPhase(GamePhase.GAME_OVER);
            addLog(caster.id === 'player' ? "VICTORY!" : "DEFEAT!", 'system');
            
            // Broadcast Game Over if online and I am the winner (or caster causing the end)
            if (gameMode === GameMode.ONLINE && caster.id === 'player') {
                 socketService.sendAction({ actionType: 'GAME_OVER', data: { winnerId: caster.id } });
            }
        }
    }, 700);
  };

  const endTurn = () => {
    if (isProcessing) return;
    setSelectedCardId(null);
    setPlayer(prev => ({ ...prev, isTurn: false, diceRolled: false, disabledSlots: [] }));
    setIsOpponentHandRevealed(false); // Reset on turn end
    
    // Process Opponent DOTs and Statuses at start of their turn
    setOpponent(prev => {
        // UPDATE: Draw 2 Cards
        const nextState = drawCard(prev, DRAW_PER_TURN);
        return processTurnStart(nextState);
    });

    addLog("Ended Turn.", 'player');
    
    if (gameMode === GameMode.ONLINE) {
        socketService.sendAction({ actionType: 'END_TURN', data: {} });
    }

    setTimeout(() => {
        if (phaseRef.current === GamePhase.GAME_OVER) return; 
        setPhase(GamePhase.OPPONENT_THINKING);
        setNotification("Opponent's Turn");
    }, 500);
  };

  // --- AI Logic Hook ---
  useEffect(() => {
    if (gameMode === GameMode.AI && phase === GamePhase.OPPONENT_THINKING) {
      const runAI = async () => {
        const checkGameOver = () => phaseRef.current === GamePhase.GAME_OVER;

        await new Promise(r => setTimeout(r, 1000));
        if (checkGameOver()) return;
        // AI Draws 2
        setOpponent(prev => drawCard(prev, DRAW_PER_TURN));
        
        await new Promise(r => setTimeout(r, 1000));
        if (checkGameOver()) return;
        const roll = Math.floor(Math.random() * 3) + 1;
        setOpponent(prev => ({ ...prev, soulPoints: prev.soulPoints + roll, slots: prev.slots.map(s => s ? { ...s, isReady: true } : null) }));
        addLog(`Opponent rolled ${roll}.`, 'opponent');

        await new Promise(r => setTimeout(r, 1000));
        if (checkGameOver()) return;
        
        // Opponent Rotation
        setOpponent(prev => {
            const activeChar = prev.board.find(c => c.position === 0);
            const isStunned = activeChar?.statuses.some(s => s.type === StatusType.STUN);
            if (isStunned) {
                addLog("Opponent Stunned! Rotation Locked.", 'system');
                return prev;
            } else {
                return { ...prev, board: rotateCharacters(prev.board) };
            }
        });

        await new Promise(r => setTimeout(r, 1000));
        if (checkGameOver()) return;
        
        const currentOpp = opponentRef.current;
        
        // AI Logic for Instants (Basic implementation: AI checks hand for Instants and casts if beneficial)
        const instants = currentOpp.hand.filter(c => c.type === CardType.INSTANT && c.cost <= currentOpp.soulPoints);
        if (instants.length > 0 && Math.random() > 0.5) {
             const instantCard = instants[0];
             // Simple AI casting
             await new Promise(r => {
                 executeSpell(currentOpp, setOpponent, playerRef.current, setPlayer, instantCard, '', -1);
                 setTimeout(r, 1000);
             });
        }
        
        // Re-fetch state after potential instant cast
        const updatedOpp = opponentRef.current;
        const playableSlots = updatedOpp.slots.map((s, i) => ({ s, i })).filter(item => item.s && item.s.isReady && item.s.card.cost <= updatedOpp.soulPoints && !updatedOpp.disabledSlots.includes(item.i));

        if (playableSlots.length > 0) {
            const pick = playableSlots[Math.floor(Math.random() * playableSlots.length)];
            const card = pick.s!.card;
            const slotIndex = pick.i;
            let tid: string | undefined;

            if (card.type === CardType.ATTACK) {
                const living = playerRef.current.board.filter(c => !c.isDead);
                if (living.length > 0) {
                    tid = card.canTargetBackline ? living[Math.floor(Math.random() * living.length)].id : playerRef.current.board.find(c => c.position === 0 && !c.isDead)?.id;
                }
            } else if (card.type === CardType.HEAL) {
                tid = updatedOpp.board.find(c => c.currentHealth < c.maxHealth && !c.isDead)?.id;
            } else if (card.type === CardType.DISCARD || card.type === CardType.MANIPULATION) {
                tid = playerRef.current.id;
            }

            if (tid) {
                await new Promise(r => {
                     executeSpell(updatedOpp, setOpponent, playerRef.current, setPlayer, card, tid!, slotIndex);
                     setTimeout(r, 1000); // Wait for spell animation to finish
                });
            }
        }

        await new Promise(r => setTimeout(r, 1000));
        if (checkGameOver()) return;
        
        setOpponent(prev => {
            const newSlots = [...prev.slots];
            const newHand = [...prev.hand];
            for (let i = 0; i < newSlots.length; i++) {
                if (prev.disabledSlots.includes(i)) continue;
                if (newSlots[i] === null && newHand.length > 0) {
                     // AI prefers not putting Instants in slots (though game rules prevent it for players, we ensure AI follows too)
                     const candidateIdx = newHand.findIndex(c => c.type !== CardType.INSTANT);
                     if (candidateIdx >= 0) {
                         newSlots[i] = { instanceId: newHand[candidateIdx].id, card: newHand[candidateIdx], isReady: false };
                         newHand.splice(candidateIdx, 1);
                     }
                }
            }
            return { ...prev, slots: newSlots, hand: newHand };
        });

        await new Promise(r => setTimeout(r, 2000));
        if (checkGameOver()) return;
        
        setOpponent(prev => ({ ...prev, disabledSlots: [] }));
        
        // Process Player DOTs at start of player turn
        setPlayer(prev => {
             // UPDATE: Draw 2
             const p = drawCard(prev, DRAW_PER_TURN);
             const processedP = processTurnStart(p);
             return { ...processedP, isTurn: true, diceRolled: false };
        });
        
        setTurnCount(prev => prev + 1); 
        setPhase(GamePhase.ROLL_PHASE);
        setShowDiceOverlay(true);
        addLog("Your Turn!", 'system');
      };
      runAI();
    }
  }, [phase, gameMode]);

  if (phase === GamePhase.START) return <><StartScreen onStart={() => startGame()} onStartOnline={startOnlineGame} onOpenLibrary={() => setShowCardLibrary(true)} onOpenDeckBuilder={() => setPhase(GamePhase.DECK_BUILDING)} />{showCardLibrary && <CardLibraryModal onClose={() => setShowCardLibrary(false)} />}</>;
  if (phase === GamePhase.DECK_BUILDING) return <DeckBuilderScreen onBack={() => setPhase(GamePhase.START)} onStartGame={(deck, chars) => startGame(deck, chars)} />;

  const isLockdownActive = selectedCardId && player.slots.find(s => s && s.card.id === selectedCardId)?.card.name === "Lockdown";

  return (
    <div className="w-full h-screen bg-black text-amber-100 overflow-hidden flex flex-col relative select-none">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black pointer-events-none"></div>
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>

      {/* Connection Status Indicator */}
      {gameMode === GameMode.ONLINE && (
          <div className="absolute top-2 left-2 z-50 flex items-center gap-2 bg-neutral-900/80 px-2 py-1 rounded border border-neutral-700">
              {phase === GamePhase.WAITING_FOR_OPPONENT ? (
                  <WifiOff size={14} className="text-red-500 animate-pulse" />
              ) : (
                  <Wifi size={14} className="text-green-500" />
              )}
              <span className="text-[10px] uppercase font-bold text-neutral-400">
                  {phase === GamePhase.WAITING_FOR_OPPONENT ? "Connecting..." : "Online"}
              </span>
          </div>
      )}

      {/* Global Game Timer */}
      {(phase === GamePhase.ROLL_PHASE || phase === GamePhase.MAIN_PHASE || phase === GamePhase.OPPONENT_THINKING) && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-black/40 px-3 py-1 rounded-full border border-yellow-900/30 flex items-center gap-2">
             <Clock size={14} className="text-yellow-600" />
             <span className="text-xs font-fantasy tracking-widest text-yellow-200/80">{formatTime(gameTime)}</span>
          </div>
      )}

      <div className="flex-1 flex flex-col">
          <TopBar 
            opponent={opponent} isLockdownActive={isLockdownActive || false} selectedCardId={selectedCardId}
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
                          <div className="absolute inset-1 bg-neutral-950 rotate-45 border border-yellow-800/50"></div>
                          <div className="relative z-10 flex flex-col items-center"><Ghost size={20} className="text-yellow-500 md:w-7 md:h-7" /><span className="text-lg md:text-2xl font-fantasy text-white font-bold leading-none mt-0.5 drop-shadow-[0_0_5px_rgba(234,179,8,0.8)]">{player.soulPoints}</span></div>
                      </div>
                      {player.isTurn && phase === GamePhase.MAIN_PHASE && (<button onClick={buyCardWithSouls} disabled={player.soulPoints < 2} className={`absolute -right-2 top-0 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center border border-neutral-900 shadow-lg transition-all z-20 ${player.soulPoints >= 2 ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:scale-110' : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'}`} style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%, 0 20%)' }}><Plus size={14} className="md:w-4 md:h-4" strokeWidth={4} /></button>)}
                   </div>
              </div>

              <div className="pointer-events-auto">
                  <button onClick={endTurn} disabled={!player.isTurn || !player.diceRolled || isProcessing} className={`group w-14 h-14 md:w-20 md:h-20 flex flex-col items-center justify-center transition-all duration-300 relative ${!player.isTurn || !player.diceRolled || isProcessing ? 'opacity-50 grayscale cursor-not-allowed scale-90' : 'hover:scale-105 cursor-pointer'}`}>
                      <div className={`absolute inset-0 bg-neutral-900 border-2 border-orange-600 shadow-[0_0_20px_rgba(234,88,12,0.3)] rotate-45 transition-colors ${player.isTurn && player.diceRolled ? 'group-hover:bg-orange-900/30 group-hover:border-orange-400' : ''}`}></div>
                      <div className="relative z-10 flex flex-col items-center"><Swords size={18} className={`mb-1 text-orange-500 md:w-6 md:h-6 ${player.isTurn ? 'group-hover:rotate-12 transition-transform' : ''}`} /><span className="text-[8px] md:text-[10px] font-bold uppercase leading-none text-orange-100">End<br/>Turn</span></div>
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
      {showSettings && <SettingsModal onConcede={concedeMatch} onResume={() => setShowSettings(false)} onOpenLibrary={() => { setShowSettings(false); setShowCardLibrary(true); }} />}
      {showCardLibrary && <CardLibraryModal onClose={() => setShowCardLibrary(false)} />}
      {inspectedItem && <InspectionModal item={inspectedItem} onClose={() => setInspectedItem(null)} />}
      {showDiceOverlay && <DiceOverlay isRolling={isRollingDice} result={diceResult} onRoll={performDiceRoll} />}
      
      {/* Waiting Screen Overlay */}
      {gameMode === GameMode.ONLINE && phase === GamePhase.WAITING_FOR_OPPONENT && (
          <div className="absolute inset-0 z-[100] bg-black/90 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-yellow-600/30 rounded-full animate-ping"></div>
                      <Wifi className="w-10 h-10 text-yellow-500 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-fantasy text-yellow-100">Searching for Opponent...</h2>
                  <p className="text-neutral-500 text-sm">Room ID locked. Waiting for connection.</p>
                  <button onClick={resetGame} className="mt-8 text-red-500 border border-red-900 px-6 py-2 hover:bg-red-900/20 rounded uppercase text-xs font-bold tracking-widest">Cancel</button>
              </div>
          </div>
      )}

      {selectedCardId && (<div className="absolute inset-0 z-10 pointer-events-none bg-black/40 flex items-center justify-center"><div className="mt-[100px] text-yellow-100 animate-bounce font-bold tracking-widest bg-neutral-900 border border-yellow-600/50 px-6 py-3 shadow-[0_0_20px_rgba(234,179,8,0.3)] text-sm md:text-base backdrop-blur-sm relative"><div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-yellow-500"></div><div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-yellow-500"></div>SELECT TARGET</div></div>)}
    </div>
  );
};

export default App;
