
import React, { useRef } from 'react';
import { Character, StatusType } from '../types';
import { Shield, Skull, Zap, Flame, ShieldAlert, ZapOff, TrendingDown, XCircle } from 'lucide-react';

interface Props {
  characters: Character[];
  isPlayer: boolean;
  onCharacterClick?: (char: Character) => void;
  isValidTarget?: (char: Character) => boolean; 
  onInspect?: (char: Character) => void;
}

const CharacterTriangle: React.FC<Props> = ({ characters, isPlayer, onCharacterClick, isValidTarget, onInspect }) => {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (char: Character) => {
    longPressTimer.current = setTimeout(() => {
       if (onInspect) onInspect(char);
    }, 800);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };
  
  const getPositionStyle = (pos: number) => {
    const radius = 100;
    let angle = 0;
    
    if (isPlayer) {
      if (pos === 0) angle = -90;
      if (pos === 1) angle = 30;  
      if (pos === 2) angle = 150; 
    } else {
      if (pos === 0) angle = 90;
      if (pos === 1) angle = 210; 
      if (pos === 2) angle = 330; 
    }

    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius;

    return {
      transform: `translate(${x}px, ${y}px)`,
    };
  };

  const tooltipPositionClass = isPlayer
    ? 'bottom-full mb-3 origin-bottom'
    : 'top-full mt-3 origin-top';

  const renderStatusIcon = (type: StatusType) => {
      switch (type) {
          case StatusType.BURN: return <Flame size={10} className="text-orange-500" />;
          case StatusType.FRAGILE: return <ShieldAlert size={10} className="text-red-400" />;
          case StatusType.WEAK: return <TrendingDown size={10} className="text-blue-400" />;
          case StatusType.STUN: return <ZapOff size={10} className="text-yellow-200" />;
      }
  };

  return (
    <div className="relative w-[300px] h-[300px] flex items-center justify-center">
      
      {/* Connecting Lines (Gold) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40 stroke-yellow-600 stroke-1" style={{ overflow: 'visible' }}>
        <polygon points={isPlayer 
          ? "150,50 236,200 64,200"
          : "150,250 236,100 64,100"
        } fill="none" className="drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]" />
      </svg>

      {characters.map((char) => {
        const isTargetable = !char.isDead && isValidTarget && isValidTarget(char);
        const animationClass = char.animationState === 'hit' ? 'animate-shake-red ring-4 ring-red-600' 
                             : char.animationState === 'heal' ? 'animate-heal-green ring-4 ring-green-400' 
                             : '';
        const isStunned = char.statuses.some(s => s.type === StatusType.STUN);

        return (
          <div
            key={char.id}
            className={`absolute flex flex-col items-center justify-center transition-all duration-700 ease-in-out group hover:z-50`}
            style={getPositionStyle(char.position)}
            onClick={() => !char.isDead && onCharacterClick && onCharacterClick(char)}
            onContextMenu={(e) => {
                e.preventDefault();
                if(onInspect) onInspect(char);
            }}
            onTouchStart={() => handleTouchStart(char)}
            onTouchEnd={handleTouchEnd}
          >
            {/* Character Node */}
            <div 
              className={`
                relative w-24 aspect-[5/7] rounded-lg border-2 bg-neutral-900 shadow-2xl overflow-hidden
                transition-all duration-300
                ${char.isDead ? 'border-neutral-800 animate-shatter' : 'border-neutral-700'}
                ${isTargetable ? 'cursor-pointer ring-4 ring-red-500 scale-110' : ''}
                ${char.position === 0 ? 'scale-110 z-20 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'z-10 scale-90 opacity-80 hover:scale-100 hover:ring-2 hover:ring-yellow-600'}
                ${animationClass}
              `}
            >
              {char.isDead && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 backdrop-blur-sm">
                   <div className="relative">
                       <XCircle className="text-red-700 w-10 h-10 opacity-80" strokeWidth={1.5} />
                       <Skull className="text-red-500 w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                   </div>
                   <span className="text-[10px] font-bold text-red-600 tracking-widest uppercase mt-1 drop-shadow-md">Shattered</span>
                   {/* Crack effect overlay */}
                   <div className="absolute inset-[-50px] bg-[url('https://www.transparenttextures.com/patterns/cracked-concrete.png')] opacity-40 mix-blend-overlay"></div>
                 </div>
              )}
              
              <img src={char.image} alt={char.name} className={`w-full h-full object-cover transition-all ${char.isDead ? 'grayscale blur-sm' : ''}`} />
              
              {/* Status Effects Row */}
              {char.statuses.length > 0 && !char.isDead && (
                  <div className="absolute top-6 right-0 flex flex-col items-end gap-1 p-1">
                      {char.statuses.map((status, idx) => (
                          <div key={idx} className="flex items-center bg-black/70 rounded-l px-1 border-r-2 border-r-red-500/50 backdrop-blur-sm">
                              {renderStatusIcon(status.type)}
                              <span className="text-[8px] font-bold text-white ml-0.5">{status.duration}</span>
                          </div>
                      ))}
                  </div>
              )}

              {/* Health Bar Overlay */}
              {!char.isDead && (
                <div className="absolute bottom-0 left-0 w-full h-6 bg-black/80 backdrop-blur-sm flex items-center px-1 border-t border-neutral-800">
                   <div className="w-full h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                     <div 
                        className={`h-full ${isPlayer ? 'bg-emerald-500' : 'bg-red-500'}`} 
                        style={{ width: `${(char.currentHealth / char.maxHealth) * 100}%` }}
                     ></div>
                   </div>
                </div>
              )}
              
              {/* Health Text */}
              {!char.isDead && (
                <div className="absolute top-1 right-1 bg-black/70 px-1.5 rounded text-[10px] font-bold text-white border border-neutral-700">
                  {char.currentHealth}
                </div>
              )}
              
              {/* Active Indicator (Gold) */}
              {char.position === 0 && !char.isDead && (
                 <div className="absolute top-1 left-1">
                   {isStunned ? (
                       <ZapOff size={14} className="text-yellow-200 fill-yellow-900 animate-pulse" />
                   ) : (
                       <Shield size={14} className="text-yellow-400 fill-yellow-400/20 animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                   )}
                 </div>
              )}
            </div>
            
            {/* Passive Tooltip (Black/Gold) */}
            <div className={`
                absolute ${tooltipPositionClass} z-50 pointer-events-none
                transition-all duration-300 transform
                ${char.position === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
            `}>
              <div className="bg-black/90 backdrop-blur-md text-amber-100 text-xs px-3 py-2 rounded-lg border border-yellow-700/50 shadow-[0_0_15px_rgba(234,179,8,0.2)] whitespace-nowrap flex flex-col items-center gap-1 min-w-[120px]">
                <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-yellow-500 font-bold">
                    <Zap size={10} className="fill-yellow-500" />
                    Passive Ability
                </div>
                {isStunned ? (
                    <span className="font-bold text-red-500 font-serif">STUNNED (Rotation Locked)</span>
                ) : (
                    <span className="font-medium text-white font-serif">{char.passive}</span>
                )}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default CharacterTriangle;
