import React from 'react';
import { Dices } from 'lucide-react';

interface Props {
  isRolling: boolean;
  result: number | null;
  onRoll: () => void;
}

const DiceOverlay: React.FC<Props> = ({ isRolling, result, onRoll }) => {
  return (
      <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
          <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-300">
              <h2 className="text-4xl font-fantasy text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-lg tracking-widest">SOUL PHASE</h2>
              <div 
                 onClick={onRoll}
                 className={`
                    w-48 h-48 rounded-2xl border-2 flex items-center justify-center cursor-pointer transition-all duration-500 relative
                    ${isRolling 
                        ? 'animate-spin border-yellow-500 bg-neutral-900' 
                        : 'border-yellow-700/30 bg-neutral-900 hover:scale-110 hover:border-yellow-400 hover:shadow-[0_0_40px_rgba(234,179,8,0.4)]'
                    }
                 `}
              >
                  {/* Decorative corners */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-yellow-700"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-yellow-700"></div>

                  {result !== null ? (
                      <span className="text-8xl font-bold text-white animate-bounce drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">{result}</span>
                  ) : (
                      <Dices size={80} className={`text-yellow-600 ${isRolling ? 'opacity-50' : ''}`} />
                  )}
              </div>
              <p className="text-lg text-yellow-100/60 animate-pulse font-serif italic">
                  {isRolling ? "Fate is turning..." : result !== null ? "Soul Power Granted!" : "Click to roll the Soul Dice"}
              </p>
          </div>
      </div>
  );
};

export default DiceOverlay;