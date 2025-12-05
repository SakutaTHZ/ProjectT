import React from 'react';
import { PlayerState, GamePhase, Card, Character } from '../../types';
import { MAX_SCORE } from '../../constants';
import CardComponent from '../CardComponent';
import CharacterTriangle from '../CharacterTriangle';
import { Hexagon, Layers, Lock, Flame, RotateCcw } from 'lucide-react';

interface Props {
  player: PlayerState;
  phase: GamePhase;
  selectedCardId: string | null;
  castingSlotIndex: number | null;
  burningSlotIndex?: number | null; // Added prop for burn animation
  getEffectiveCost: (card: Card) => number;
  onCharacterClick: (char: Character, isEnemy: boolean) => void;
  isValidTarget: (char: Character, isEnemy: boolean) => boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, slotIndex: number) => void;
  onSlotCardClick: (slotIndex: number) => void;
  onBurnCard: (e: React.MouseEvent, slotIndex: number) => void;
  onInspectCard: (card: Card) => void;
  onResetPlacedSpells: () => void;
  onHandCardClick: (card: Card) => void;
  onDragStart: (e: React.DragEvent, card: Card) => void;
  onLogDeck: () => void;
}

const PlayerHUD: React.FC<Props> = ({
  player,
  phase,
  selectedCardId,
  castingSlotIndex,
  burningSlotIndex,
  getEffectiveCost,
  onCharacterClick,
  isValidTarget,
  onDragOver,
  onDrop,
  onSlotCardClick,
  onBurnCard,
  onInspectCard,
  onResetPlacedSpells,
  onHandCardClick,
  onDragStart,
  onLogDeck
}) => {

  const renderSlot = (i: number) => {
    const slot = player.slots[i];
    const isCasting = castingSlotIndex === i;
    const isBurning = burningSlotIndex === i;
    
    // Determine specific animation class based on card type
    let animClass = '';
    if (isCasting && slot) {
        const type = slot.card.type;
        animClass = `animate-cast-${type}`; 
    } else if (isBurning && slot) {
        animClass = 'animate-burn';
    }

    return (
        <div 
            key={i} 
            className={`
                relative w-20 md:w-28 aspect-[5/7] flex items-center justify-center transition-all duration-300 group
                ${isCasting ? 'z-50' : ''}
                ${slot && !isCasting ? 'hover:-translate-y-4' : ''} 
            `}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, i)}
            onClick={() => onSlotCardClick(i)}
        >
             {/* Notched Slot Container -> Changed to Plus Shape */}
             <div className={`
                absolute inset-0 slot-plus p-[2px] transition-colors
                ${player.disabledSlots.includes(i) ? 'bg-red-900/50' : (slot ? 'bg-gradient-to-br from-yellow-900/40 to-yellow-900/20' : 'bg-gradient-to-br from-neutral-700/30 to-neutral-800/30 hover:from-yellow-700/40 hover:to-yellow-900/40')}
            `}>
                <div className="w-full h-full bg-neutral-900/80 slot-plus flex items-center justify-center relative backdrop-blur-sm">
                     {/* Inner texture */}
                     <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                     
                     {player.disabledSlots.includes(i) ? (
                        <div className="flex flex-col items-center text-red-500 z-10">
                             <Lock size={20} className="mb-1" />
                             <span className="text-[8px] font-bold">LOCKED</span>
                        </div>
                     ) : !slot ? (
                        <div className="text-neutral-700 text-[10px] md:text-xs font-bold uppercase tracking-widest pointer-events-none z-10">Slot {i+1}</div>
                     ) : null}
                </div>
            </div>

            {/* Card Content */}
            {slot && (
                <>
                    {/* Apply rotation on the wrapper to match Opponent style */}
                    <div className={`relative z-10 w-full h-full transform scale-90 transition-all duration-700 ease-in-out ${!slot.isReady ? 'rotate-90' : ''} ${animClass}`}>
                        <CardComponent 
                            card={slot.card} 
                            effectiveCost={getEffectiveCost(slot.card)}
                            isSelected={selectedCardId === slot.card.id}
                            isHorizontal={!slot.isReady} // Only triggers clock overlay now
                            isReady={slot.isReady}
                            disabled={phase !== GamePhase.MAIN_PHASE}
                            onContextMenu={() => onInspectCard(slot.card)}
                            className="w-full h-full"
                            disableHoverTransform={true} // Disable internal hover so parent handles "upward" movement
                            isSlot={true} // Ensure text is centered
                        />
                    </div>
                    
                    {/* Burn Button - Moved OUTSIDE rotated wrapper so it stays Top-Right relative to Slot */}
                    {!isCasting && !isBurning && (
                        <div 
                            onClick={(e) => onBurnCard(e, i)}
                            title="Sacrifice Card for +1 Soul Point"
                            className="absolute -top-3 -right-3 z-50 bg-neutral-800 hover:bg-red-600 text-neutral-400 hover:text-white p-1 md:p-1.5 rounded-full shadow-lg border border-neutral-600 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                            <Flame size={12} className="md:w-3.5 md:h-3.5" />
                        </div>
                    )}
                </>
            )}
        </div>
    );
  };

  return (
    <div className="flex-1 w-full bg-gradient-to-t from-black via-neutral-950 to-transparent flex flex-col justify-end relative z-20">

        {/* Row 1: Battlefield (Linear Layout) - Scaled */}
        <div className="flex justify-center items-center gap-4 md:gap-6 w-full mb-52 md:mb-40 relative pt-4 md:pt-12 px-1 origin-center scale-[0.5] xs:scale-[0.6] sm:scale-75 md:scale-100">
             
             {/* Left Slots (0, 1, 2) */}
             <div className="flex gap-2 md:gap-6">
                 {renderSlot(0)}
                 {renderSlot(1)}
                 {renderSlot(2)}
             </div>

            {/* Character Triangle */}
            <div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px] flex items-center justify-center shrink-0">
                <div className="scale-[0.8] md:scale-75">
                    <CharacterTriangle 
                        characters={player.board} 
                        isPlayer={true}
                        onCharacterClick={(c) => onCharacterClick(c, false)} 
                        isValidTarget={(char) => isValidTarget(char, false)}
                        onInspect={(c) => onInspectCard({ ...c, type: 'CHARACTER' } as any)} // Cast for compatibility
                    />
                </div>
            </div>

            {/* Right Slots (3, 4, 5) */}
            <div className="flex gap-2 md:gap-6">
                 {renderSlot(3)}
                 {renderSlot(4)}
                 {renderSlot(5)}
            </div>
        </div>

        {/* --- Absolute Positioned Bottom Elements --- */}
        
        {/* Player Info (Bottom Left) */}
        <div className="absolute bottom-24 left-2 md:bottom-28 md:left-8 z-40 flex items-center gap-2 md:gap-3 bg-neutral-900/90 p-2 border-l-4 border-l-yellow-600/50 border border-neutral-800 shadow-xl max-w-[120px] md:max-w-none scale-90 md:scale-100 origin-bottom-left backdrop-blur-md">
            <img src={player.avatar} className="w-8 h-8 md:w-10 md:h-10 rounded-sm border border-yellow-600/40 shadow-lg" alt="Player" />
            <div className="text-left">
                <div className="font-bold text-yellow-100 font-fantasy tracking-wider text-xs md:text-sm truncate">{player.name}</div>
                <div className="flex gap-1 mt-1">
                    {[...Array(MAX_SCORE)].map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 md:w-2 md:h-2 rotate-45 border border-neutral-900 ${i < player.score ? 'bg-emerald-500 shadow-[0_0_8px_green]' : 'bg-neutral-700'}`}></div>
                    ))}
                </div>
            </div>
        </div>

        {/* Hand (Center Bottom) */}
        <div className="absolute bottom-24 md:bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-2xl px-4 flex justify-center z-30 pointer-events-none">
            <div className="pointer-events-auto flex -space-x-12 md:-space-x-12 hover:-space-x-4 transition-all duration-300 items-end pb-2 scale-[0.6] md:scale-90 origin-bottom">
                {player.hand.length === 0 ? (
                    <div className="text-yellow-600/50 text-sm italic font-serif tracking-widest whitespace-nowrap mb-8 bg-black/50 px-6 py-2 border border-yellow-900/20">
                        Hand Empty
                    </div>
                ) : (
                    player.hand.map((card, index) => {
                        const offset = index - (player.hand.length - 1) / 2;
                        const rotate = offset * 5;
                        const translateY = Math.abs(offset) * 5;
                        
                        return (
                        <div 
                            key={card.id} 
                            style={{ transform: `rotate(${rotate}deg) translateY(${translateY}px)` }}
                            className="origin-bottom transition-transform hover:!rotate-0 hover:!-translate-y-24 hover:scale-125 hover:z-50 z-0 animate-draw cursor-grab active:cursor-grabbing"
                            draggable={player.isTurn && phase === GamePhase.MAIN_PHASE}
                            onDragStart={(e) => onDragStart(e, card)}
                        >
                            <CardComponent 
                                card={card} 
                                onClick={() => onHandCardClick(card)} 
                                onContextMenu={() => onInspectCard(card)}
                                disabled={!player.isTurn || !player.diceRolled}
                                className="w-24 md:w-32 aspect-[5/7] shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                            />
                        </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Deck & Discard (Bottom Right) */}
        <div className="absolute bottom-24 right-2 md:bottom-28 md:right-8 z-40 flex gap-2 md:gap-4 items-end justify-end scale-75 md:scale-100 origin-bottom-right">
            {/* Discard Pile */}
            <div className="relative group cursor-help">
                <div className="text-center text-[8px] md:text-[10px] text-neutral-500 uppercase tracking-wider mb-1 font-bold">Graveyard</div>
                <div className="w-14 h-20 md:w-20 md:h-28 rounded border border-neutral-800 bg-neutral-900/80 flex items-center justify-center relative hover:border-neutral-500 transition-colors">
                    {player.discard.length > 0 ? (
                        <>
                            <img 
                                src={player.discard[player.discard.length - 1].image} 
                                alt="Discard" 
                                className="w-full h-full object-cover opacity-30 grayscale group-hover:grayscale-0 transition-all p-1" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center font-bold text-lg md:text-xl text-neutral-300 drop-shadow-md">
                                {player.discard.length}
                            </div>
                        </>
                    ) : (
                        <Layers className="text-neutral-700 w-5 h-5 md:w-6 md:h-6" />
                    )}
                </div>
            </div>

            {/* Deck Pile */}
            <div className="relative group cursor-pointer" onClick={onLogDeck}>
                {/* Reset Button (Positioned on top of Library) */}
                {player.isTurn && phase === GamePhase.MAIN_PHASE && player.slots.some(s => s && !s.isReady) && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                        <button
                            onClick={(e) => { e.stopPropagation(); onResetPlacedSpells(); }}
                            className="bg-neutral-800 text-yellow-600 hover:text-yellow-400 hover:bg-neutral-700 p-2 rounded-full border border-yellow-900/30 shadow-lg transition-all"
                            title="Reset Spells placed this turn"
                        >
                            <RotateCcw size={16} />
                        </button>
                    </div>
                )}

                <div className="text-center text-[8px] md:text-[10px] text-neutral-500 uppercase tracking-wider mb-1 font-bold">Library</div>
                <div className="w-14 h-20 md:w-20 md:h-28 border-2 border-yellow-900/30 bg-neutral-900 shadow-2xl relative transition-transform hover:-translate-y-2 overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Hexagon className="text-yellow-700/30 opacity-50 w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    {/* Stack Effect */}
                    {player.deck.length > 2 && <div className="absolute top-0.5 left-0.5 w-full h-full bg-neutral-800 -z-10 border border-neutral-700"></div>}
                    <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 font-bold text-yellow-500 text-base md:text-lg drop-shadow-md">
                        {player.deck.length}
                    </div>
                </div>
            </div>
        </div>

    </div>
  );
};

export default PlayerHUD;