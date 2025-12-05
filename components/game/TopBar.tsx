import React from 'react';
import { PlayerState, CardType, Character, Card } from '../../types';
import { MAX_SCORE } from '../../constants';
import CardComponent from '../CardComponent';
import CharacterTriangle from '../CharacterTriangle';
import { ScrollText, Settings, Hexagon, Layers, Lock, Eye } from 'lucide-react';

interface Props {
  opponent: PlayerState;
  isLockdownActive: boolean;
  selectedCardId: string | null;
  playerSlotWithCardId: (id: string) => any;
  castingSlotIndex: number | null;
  onToggleLog: () => void;
  showLog: boolean;
  onOpenSettings: () => void;
  onPlayerTargetClick: (isOpponent: boolean) => void;
  onOpponentSlotClick: (index: number) => void;
  onCharacterClick: (char: Character, isEnemy: boolean) => void;
  isValidTarget: (char: Character, isEnemy: boolean) => boolean;
  onInspectCard: (card: Card | Character) => void;
  isOpponentHandRevealed?: boolean; // New Prop
}

const TopBar: React.FC<Props> = ({ 
  opponent, 
  isLockdownActive, 
  selectedCardId, 
  playerSlotWithCardId,
  castingSlotIndex,
  onToggleLog, 
  showLog, 
  onOpenSettings,
  onPlayerTargetClick,
  onOpponentSlotClick,
  onCharacterClick,
  isValidTarget,
  onInspectCard,
  isOpponentHandRevealed
}) => {
  
  const isDiscardActive = selectedCardId && playerSlotWithCardId(selectedCardId)?.card.type === CardType.DISCARD;

  const renderSlot = (i: number) => {
      const slot = opponent.slots[i];
      const isCasting = castingSlotIndex === i;
      
      // Determine specific animation class based on card type
      let animClass = '';
      if (isCasting && slot) {
          const type = slot.card.type;
          animClass = `animate-cast-${type}`; 
      }

      return (
        <div 
            key={i} 
            onClick={() => isLockdownActive ? onOpponentSlotClick(i) : undefined}
            className={`
                w-16 md:w-24 aspect-[5/7] flex items-center justify-center relative transition-all duration-300
                ${isCasting ? 'z-50' : ''}
            `}
        >
             {/* Notched Slot Container -> Changed to Plus Shape */}
            <div className={`
                absolute inset-0 slot-plus p-[2px] transition-colors
                ${opponent.disabledSlots.includes(i) ? 'bg-red-900/50' : 'bg-gradient-to-br from-yellow-700/30 to-yellow-900/30'}
                ${isLockdownActive && !opponent.disabledSlots.includes(i) ? 'animate-pulse cursor-pointer bg-red-500' : ''}
            `}>
                <div className="w-full h-full bg-neutral-900/80 slot-plus flex items-center justify-center relative backdrop-blur-sm">
                     {/* Inner texture */}
                     <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                     
                     {opponent.disabledSlots.includes(i) ? (
                        <Lock className="text-red-600 w-6 h-6 z-10" />
                     ) : !slot && (
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-900/40"></div>
                     )}
                </div>
            </div>

            {/* Content */}
            {slot && (
                <div className={`relative z-10 w-full h-full transform scale-90 transition-all duration-700 ease-in-out ${!slot.isReady ? 'rotate-90' : ''} ${animClass}`}>
                    <CardComponent isFaceDown className="w-full h-full" isSlot={true} />
                </div>
            )}
        </div>
      );
  };

  return (
    <>
      {/* --- Top Right Controls (Log & Settings) --- */}
      <div className="absolute top-4 right-4 z-[55] flex gap-3">
        <button 
          onClick={onToggleLog}
          className={`
            p-2 rounded border transition-all shadow-lg
            ${showLog ? 'bg-yellow-700 text-white border-yellow-500' : 'bg-neutral-900 text-yellow-600 border-yellow-900/30 hover:bg-neutral-800'}
          `}
          title="Match History"
        >
          <ScrollText size={20} />
        </button>
        <button 
          onClick={onOpenSettings}
          className="bg-neutral-900 p-2 rounded border border-yellow-900/30 hover:bg-neutral-800 transition-colors shadow-lg"
          title="Settings"
        >
          <Settings size={20} className="text-yellow-600" />
        </button>
      </div>

      {/* --- Opponent Area Container --- */}
      <div className="w-full flex flex-col relative z-30 pt-2 pb-4">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-transparent pointer-events-none"></div>
        
        {/* Row 1: Hand & Info */}
        <div className="relative w-full h-24 flex justify-center z-10">
            
            {/* Identity (Absolute Left) */}
            <div className="absolute top-2 left-2 md:left-8 flex gap-2 md:gap-4 items-start z-40">
                <div 
                    className={`relative cursor-pointer ${isDiscardActive ? 'ring-4 ring-red-500 rounded-full animate-pulse' : ''}`} 
                    onClick={() => onPlayerTargetClick(true)}
                >
                    <img src={opponent.avatar} className="w-10 h-10 md:w-14 md:h-14 rounded-full border border-red-900 shadow-[0_0_10px_rgba(220,38,38,0.3)] grayscale" alt="Opponent" />
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-neutral-900 rounded-full flex items-center justify-center text-[10px] md:text-xs border border-yellow-700 text-yellow-500 font-bold font-fantasy">
                       {opponent.soulPoints}
                    </div>
                </div>

                <div className="flex flex-col">
                    <h3 className="font-bold text-red-500 font-fantasy text-sm md:text-base leading-tight tracking-wide cursor-pointer" onClick={() => onPlayerTargetClick(true)}>{opponent.name}</h3>
                    {/* Score Dots */}
                    <div className="flex items-center gap-1 mt-1 mb-1">
                        {[...Array(MAX_SCORE)].map((_, i) => (
                            <div key={i} className={`w-1.5 h-1.5 rotate-45 border border-neutral-800 ${i < opponent.score ? 'bg-red-600 shadow-[0_0_5px_red]' : 'bg-neutral-800'}`}></div>
                        ))}
                    </div>
                    {/* Deck & Discard Info */}
                    <div className="flex gap-3 text-[10px] text-neutral-600">
                        <div className="flex items-center gap-1" title="Opponent Deck">
                            <Hexagon size={10} className="text-yellow-700" />
                            <span>{opponent.deck.length}</span>
                        </div>
                        <div className="flex items-center gap-1" title="Opponent Discard">
                             <Layers size={10} className="text-neutral-700" />
                             <span>{opponent.discard.length}</span>
                        </div>
                    </div>
                    
                    {/* Last Played Card Visual */}
                    {opponent.lastPlayedCard && (
                       <div className="mt-2" title="Last Played Card">
                           <div 
                             className="w-10 aspect-[5/7] relative cursor-pointer hover:scale-150 origin-top-left transition-transform z-50"
                             onClick={() => opponent.lastPlayedCard && onInspectCard(opponent.lastPlayedCard)}
                           >
                               <CardComponent card={opponent.lastPlayedCard} disableHover className="w-full h-full" />
                           </div>
                       </div>
                    )}
                </div>
            </div>

            {/* Hand (Center) */}
            <div className="flex -space-x-8 md:-space-x-3 items-start justify-center pt-2">
                {isOpponentHandRevealed && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full animate-pulse border border-white/20">
                        <Eye size={16} className="text-white" />
                        <span className="text-xs font-bold text-white uppercase tracking-widest">Hand Revealed</span>
                    </div>
                )}

                {opponent.hand.map((card, i) => (
                    <div key={i} className="origin-top hover:translate-y-4 transition-transform duration-300 animate-draw-opponent scale-50 md:scale-90">
                        <CardComponent 
                           card={card} 
                           isFaceDown={!isOpponentHandRevealed} 
                           className="w-16 md:w-20 aspect-[5/7]" 
                           onClick={() => isOpponentHandRevealed && onInspectCard(card)}
                        />
                    </div>
                ))}
                {opponent.hand.length === 0 && (
                    <div className="text-nowrap text-xs text-neutral-700 italic mt-4 font-serif">Empty Hand</div>
                )}
            </div>
        </div>

        {/* Row 2: Battlefield (Linear Layout) */}
        <div className="flex justify-center items-center gap-4 md:gap-6 w-full mt-2 md:mt-4 pb-4 md:pb-12 px-1 origin-center scale-[0.5] xs:scale-[0.6] sm:scale-75 md:scale-100 z-10">
            {/* Left Slots (0, 1, 2) */}
            <div className="flex gap-2 md:gap-6">
                {renderSlot(0)}
                {renderSlot(1)}
                {renderSlot(2)}
            </div>

            {/* Character Triangle (Center) */}
            <div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px] flex items-center justify-center shrink-0"> 
                <div className="scale-[0.8] md:scale-75">
                    <CharacterTriangle 
                        characters={opponent.board} 
                        isPlayer={false} 
                        onCharacterClick={(c) => onCharacterClick(c, true)}
                        isValidTarget={(char) => isValidTarget(char, true)}
                        onInspect={(c) => onInspectCard({ ...c, type: 'CHARACTER' } as any)} // Allow inspection of enemy chars
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

      </div>
    </>
  );
};

export default TopBar;