import React, { useRef } from 'react';
import { Card, CardType } from '../types';
import { Flame, Heart, ShieldAlert, Zap, Hexagon, Clock, Skull, Lock, Wind } from 'lucide-react';

interface CardProps {
  card?: Card; // Optional if face down
  onClick?: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isSelected?: boolean;
  isFaceDown?: boolean;
  effectiveCost?: number; // The actual cost to play (after passives)
  isHorizontal?: boolean; // For cards placed in slots but not ready
  isReady?: boolean; // For cards in slots that are ready to use
  isSlot?: boolean; // NEW: Indicates if the card is inside a spell slot (affects layout)
  className?: string; // Allow size overrides
  disableHover?: boolean; // Disable the hover scale effect entirely
  disableHoverTransform?: boolean; // Disable just the transform (movement) but keep pointer events. Used for slots.
}

const CardComponent: React.FC<CardProps> = ({ 
  card, 
  onClick, 
  onContextMenu,
  disabled, 
  isSelected, 
  isFaceDown, 
  effectiveCost,
  isHorizontal,
  isReady,
  isSlot,
  className = "w-40 aspect-[5/7]", // Default standard size with correct ratio
  disableHover = false,
  disableHoverTransform = false
}) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isFaceDown) return;
    longPressTimer.current = setTimeout(() => {
       if (onContextMenu) {
         // Create a synthetic event
         onContextMenu(e as unknown as React.MouseEvent);
       }
    }, 800);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  if (isFaceDown) {
    return (
      <div className={`
        relative rounded-xl border-2 border-yellow-600/50 bg-yellow-900 shadow-xl overflow-hidden flex items-center justify-center transform transition-transform 
        ${className}
        ${!disableHover && !disableHoverTransform ? 'hover:translate-y-2' : ''}
      `}>
        {/* Yellowish/Gold Card Back Theme */}
        <div className="absolute inset-0 bg-yellow-950">
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
             {/* Decorative Border */}
             <div className="absolute inset-1.5 border border-yellow-500/30 rounded-lg"></div>
             <div className="absolute inset-3 border border-yellow-600/20 rounded-md"></div>
             
             {/* Center Emblem */}
             <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-16 h-16 border-2 border-yellow-500/40 rotate-45 flex items-center justify-center bg-yellow-900/20 backdrop-blur-sm">
                     <div className="w-12 h-12 border border-yellow-400/20 flex items-center justify-center">
                        <Hexagon size={24} className="text-yellow-500 animate-pulse drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
                     </div>
                 </div>
             </div>
             
             {/* Gradient Shine */}
             <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-yellow-500/10 pointer-events-none"></div>
        </div>
      </div>
    );
  }

  if (!card) return null;

  // Use effective cost if provided, otherwise default to card cost
  const finalCost = effectiveCost !== undefined ? effectiveCost : card.cost;
  const isCostReduced = effectiveCost !== undefined && effectiveCost < card.cost;

  // --- THEME COLOR LOGIC ---
  const getColors = () => {
    switch (card.type) {
      case CardType.ATTACK:
        return {
          border: 'border-red-600/60',
          shadow: 'shadow-[0_0_15px_rgba(220,38,38,0.2)]',
          badgeBg: 'bg-red-950/80',
          badgeText: 'text-red-400',
          iconColor: 'text-red-500',
          costBorder: 'border-red-600/60',
        };
      case CardType.HEAL:
        return {
          border: 'border-emerald-500/60',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          badgeBg: 'bg-emerald-950/80',
          badgeText: 'text-emerald-400',
          iconColor: 'text-emerald-500',
          costBorder: 'border-emerald-500/60',
        };
      case CardType.TRAP:
        return {
          border: 'border-orange-500/60',
          shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
          badgeBg: 'bg-orange-950/80',
          badgeText: 'text-orange-400',
          iconColor: 'text-orange-500',
          costBorder: 'border-orange-500/60',
        };
      case CardType.UTILITY:
        return {
          border: 'border-blue-500/60',
          shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
          badgeBg: 'bg-blue-950/80',
          badgeText: 'text-blue-400',
          iconColor: 'text-blue-500',
          costBorder: 'border-blue-500/60',
        };
      case CardType.DISCARD:
        return {
          border: 'border-violet-500/60',
          shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]',
          badgeBg: 'bg-violet-950/80',
          badgeText: 'text-violet-400',
          iconColor: 'text-violet-400',
          costBorder: 'border-violet-500/60',
        };
      case CardType.MANIPULATION:
        return {
          border: 'border-fuchsia-500/60',
          shadow: 'shadow-[0_0_15px_rgba(217,70,239,0.2)]',
          badgeBg: 'bg-fuchsia-950/80',
          badgeText: 'text-fuchsia-400',
          iconColor: 'text-fuchsia-500',
          costBorder: 'border-fuchsia-500/60',
        };
      case CardType.INSTANT:
        return {
          border: 'border-white/70',
          shadow: 'shadow-[0_0_20px_rgba(255,255,255,0.3)]',
          badgeBg: 'bg-neutral-200/90',
          badgeText: 'text-neutral-900',
          iconColor: 'text-white',
          costBorder: 'border-white',
        };
      default:
        return {
          border: 'border-neutral-500/60',
          shadow: 'shadow-lg',
          badgeBg: 'bg-neutral-800',
          badgeText: 'text-neutral-400',
          iconColor: 'text-white',
          costBorder: 'border-neutral-500/60',
        };
    }
  };

  const colors = getColors();

  const getIcon = () => {
    switch (card.type) {
      case CardType.ATTACK: return <Flame size={16} className={colors.iconColor} />;
      case CardType.HEAL: return <Heart size={16} className={colors.iconColor} />;
      case CardType.TRAP: return <ShieldAlert size={16} className={colors.iconColor} />;
      case CardType.MANIPULATION: return <Lock size={16} className={colors.iconColor} />;
      case CardType.DISCARD: return <Skull size={16} className={colors.iconColor} />;
      case CardType.INSTANT: return <Wind size={16} className={colors.iconColor} />;
      default: return <Zap size={16} className={colors.iconColor} />;
    }
  };

  // State Styles
  let stateStyles = `border-2 bg-neutral-900 ${colors.border} ${colors.shadow}`;
  
  if (isSelected) {
    stateStyles += ` -translate-y-8 z-50 scale-105 ring-4 ring-offset-2 ring-offset-black ${colors.border.replace('border', 'ring')}`;
  } else if (isReady) {
    stateStyles += ` ring-2 ring-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.2)]`;
  }

  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          onContextMenu(e);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        relative rounded-xl overflow-hidden
        transition-all duration-300 transform select-none
        ${className}
        ${stateStyles}
        ${!disabled && !disableHover && !disableHoverTransform ? 'cursor-pointer card-hover' : ''}
        ${disabled ? 'opacity-70 cursor-not-allowed grayscale-[0.5]' : ''}
        ${isHorizontal ? 'opacity-90' : ''} 
      `}
    >
      {/* Not Ready Overlay - Clock Icon */}
      {isHorizontal && (
          <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center pointer-events-none">
             <div className="bg-neutral-900/90 p-2 rounded-full border border-yellow-700/50 -rotate-90 shadow-lg backdrop-blur-sm">
                <Clock className="text-yellow-500 w-8 h-8 animate-pulse" />
             </div>
          </div>
      )}

      {/* Cost Badge - Centered if in slot due to Plus shape cutout */}
      <div className={`
        absolute w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold z-20 shadow-lg
        font-fantasy tracking-wider bg-neutral-900
        ${isSlot ? 'top-1 left-1/2 -translate-x-1/2' : 'top-2 left-2'}
        ${isCostReduced ? 'text-green-300 border-green-500 scale-110' : `${colors.iconColor} ${colors.costBorder}`}
        ${isHorizontal ? '-rotate-90' : ''}
      `}>
        {finalCost}
      </div>

      {/* Image Area */}
      <div className={`h-1/2 w-full overflow-hidden relative border-b ${colors.border} border-opacity-30`}>
        <img src={card.image} alt={card.name} className="w-full h-full object-cover opacity-90 hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neutral-900"></div>
      </div>

      {/* Content */}
      <div className="p-3 absolute bottom-0 w-full h-1/2 flex flex-col justify-between bg-gradient-to-t from-neutral-900 via-neutral-900 to-transparent">
        <div>
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-sm font-bold truncate font-fantasy tracking-wide ${colors.iconColor}`}>{card.name}</h3>
            {getIcon()}
          </div>
          <p className="text-[10px] text-neutral-400 leading-tight">
            {card.description}
          </p>
        </div>
        
        {/* Type Badge */}
        <div className={`text-center text-[9px] uppercase tracking-wider ${colors.badgeText} ${colors.badgeBg} border ${colors.border} border-opacity-30 rounded py-1`}>
          {card.type}
        </div>
      </div>
    </div>
  );
};

export default CardComponent;