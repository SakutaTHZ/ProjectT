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
          border: 'border-red-600',
          shadow: 'shadow-[0_0_15px_rgba(220,38,38,0.2)]',
          badgeBg: 'bg-red-950',
          badgeText: 'text-red-200',
          iconColor: 'text-red-500',
          costBorder: 'border-red-500',
          costBg: 'bg-red-950',
          titleBg: 'bg-gradient-to-r from-red-950 to-neutral-900'
        };
      case CardType.HEAL:
        return {
          border: 'border-emerald-500',
          shadow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
          badgeBg: 'bg-emerald-950',
          badgeText: 'text-emerald-200',
          iconColor: 'text-emerald-500',
          costBorder: 'border-emerald-500',
          costBg: 'bg-emerald-950',
          titleBg: 'bg-gradient-to-r from-emerald-950 to-neutral-900'
        };
      case CardType.TRAP:
        return {
          border: 'border-orange-500',
          shadow: 'shadow-[0_0_15px_rgba(249,115,22,0.2)]',
          badgeBg: 'bg-orange-950',
          badgeText: 'text-orange-200',
          iconColor: 'text-orange-500',
          costBorder: 'border-orange-500',
          costBg: 'bg-orange-950',
          titleBg: 'bg-gradient-to-r from-orange-950 to-neutral-900'
        };
      case CardType.UTILITY:
        return {
          border: 'border-blue-500',
          shadow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)]',
          badgeBg: 'bg-blue-950',
          badgeText: 'text-blue-200',
          iconColor: 'text-blue-500',
          costBorder: 'border-blue-500',
          costBg: 'bg-blue-950',
          titleBg: 'bg-gradient-to-r from-blue-950 to-neutral-900'
        };
      case CardType.DISCARD:
        return {
          border: 'border-violet-500',
          shadow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]',
          badgeBg: 'bg-violet-950',
          badgeText: 'text-violet-200',
          iconColor: 'text-violet-400',
          costBorder: 'border-violet-500',
          costBg: 'bg-violet-950',
          titleBg: 'bg-gradient-to-r from-violet-950 to-neutral-900'
        };
      case CardType.MANIPULATION:
        return {
          border: 'border-fuchsia-500',
          shadow: 'shadow-[0_0_15px_rgba(217,70,239,0.2)]',
          badgeBg: 'bg-fuchsia-950',
          badgeText: 'text-fuchsia-200',
          iconColor: 'text-fuchsia-500',
          costBorder: 'border-fuchsia-500',
          costBg: 'bg-fuchsia-950',
          titleBg: 'bg-gradient-to-r from-fuchsia-950 to-neutral-900'
        };
      case CardType.INSTANT:
        return {
          border: 'border-white',
          shadow: 'shadow-[0_0_20px_rgba(255,255,255,0.3)]',
          badgeBg: 'bg-neutral-200',
          badgeText: 'text-neutral-900',
          iconColor: 'text-white',
          costBorder: 'border-white',
          costBg: 'bg-neutral-800',
          titleBg: 'bg-gradient-to-r from-neutral-800 to-neutral-900'
        };
      default:
        return {
          border: 'border-neutral-500',
          shadow: 'shadow-lg',
          badgeBg: 'bg-neutral-800',
          badgeText: 'text-neutral-400',
          iconColor: 'text-white',
          costBorder: 'border-neutral-500',
          costBg: 'bg-neutral-900',
          titleBg: 'bg-neutral-900'
        };
    }
  };

  const colors = getColors();

  const getIcon = () => {
    switch (card.type) {
      case CardType.ATTACK: return <Flame size={14} className={colors.iconColor} fill="currentColor" fillOpacity={0.2} />;
      case CardType.HEAL: return <Heart size={14} className={colors.iconColor} fill="currentColor" fillOpacity={0.2} />;
      case CardType.TRAP: return <ShieldAlert size={14} className={colors.iconColor} fill="currentColor" fillOpacity={0.2} />;
      case CardType.MANIPULATION: return <Lock size={14} className={colors.iconColor} fill="currentColor" fillOpacity={0.2} />;
      case CardType.DISCARD: return <Skull size={14} className={colors.iconColor} fill="currentColor" fillOpacity={0.2} />;
      case CardType.INSTANT: return <Wind size={14} className={colors.iconColor} fill="currentColor" fillOpacity={0.2} />;
      default: return <Zap size={14} className={colors.iconColor} fill="currentColor" fillOpacity={0.2} />;
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
        relative rounded-xl overflow-visible
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
          <div className="absolute inset-0 z-30 bg-black/50 flex items-center justify-center pointer-events-none rounded-xl">
             <div className="bg-neutral-900/90 p-2 rounded-full border border-yellow-700/50 -rotate-90 shadow-lg backdrop-blur-sm">
                <Clock className="text-yellow-500 w-8 h-8 animate-pulse" />
             </div>
          </div>
      )}

      {/* Cost Badge */}
      <div className={`
        absolute z-30 flex items-center justify-center font-bold font-fantasy tracking-wider shadow-lg rounded-full border-2
        ${isSlot 
            ? 'top-1 left-1/2 -translate-x-1/2 w-7 h-7 text-sm' 
            : '-top-2 -left-2 w-8 h-8 text-base'
        }
        ${isCostReduced ? 'text-green-300 border-green-500 bg-green-950 scale-110' : `${colors.iconColor} ${colors.costBorder} ${colors.costBg}`}
        ${isHorizontal ? '-rotate-90' : ''}
      `}>
        {finalCost}
      </div>

      {/* Internal Container for Clipping content inside border */}
      <div className="w-full h-full rounded-[10px] overflow-hidden flex flex-col relative bg-neutral-900">
          
          {/* Image Area - 55% Height */}
          <div className="h-[55%] w-full relative">
            <img src={card.image} alt={card.name} className="w-full h-full object-cover transition-transform duration-500" />
            
            {/* Gradient Overlay for text readability at the break */}
            <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-neutral-950 to-transparent"></div>
            <div className={`absolute bottom-0 w-full h-[1px] ${colors.border} opacity-50`}></div>
          </div>

          {/* Content Area - 45% Height */}
          <div className="h-[45%] w-full flex flex-col bg-neutral-900 relative">
            
            {/* Title Bar */}
            <div className={`flex items-center justify-between px-2 py-1.5 border-b border-white/5 ${colors.titleBg}`}>
                <h3 className={`text-[10px] md:text-xs font-bold truncate font-fantasy tracking-wide ${colors.iconColor} flex-1 mr-1`}>
                    {card.name}
                </h3>
                <div className="shrink-0 opacity-90">
                    {getIcon()}
                </div>
            </div>

            {/* Description */}
            <div className="p-2 flex-1 overflow-hidden">
                <p className="text-[9px] text-neutral-300 leading-tight font-sans opacity-90">
                    {card.description}
                </p>
                {/* Stats (Damage/Heal) Optional Display could go here */}
                {card.damage !== undefined && card.damage !== 0 && (
                    <div className="mt-1 text-[9px] font-bold text-neutral-500">
                        {card.damage > 0 ? `DMG: ${card.damage}` : `HEAL: ${Math.abs(card.damage)}`}
                    </div>
                )}
            </div>
            
            {/* Type Badge Footer */}
            <div className={`
                w-full text-center text-[8px] font-bold uppercase tracking-widest py-0.5
                ${colors.badgeBg} ${colors.badgeText} border-t ${colors.border} border-opacity-30
            `}>
              {card.type}
            </div>
          </div>
      </div>
    </div>
  );
};

export default CardComponent;