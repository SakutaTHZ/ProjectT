
import React, { useState, useEffect } from 'react';
import { MAX_SCORE } from '../../constants';
import { Home } from 'lucide-react';

interface Props {
  score: number;
  notification: string;
  onReset: () => void;
  onGoHome: () => void;
}

const GameOverScreen: React.FC<Props> = ({ score, notification, onReset, onGoHome }) => {
  const isVictory = score >= MAX_SCORE;
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Delay the appearance of the reset button for effect
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center text-white overflow-hidden animate-bg-darken">
      
      {/* Dramatic Background Light Effect */}
      <div className={`
          absolute inset-0 pointer-events-none opacity-50
          bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] 
          ${isVictory ? 'from-yellow-500/20 via-transparent to-transparent' : 'from-red-600/20 via-transparent to-transparent'}
      `}></div>

      <div className="relative z-10 flex flex-col items-center">
          <h2 className={`
            text-8xl font-fantasy mb-8 tracking-wider drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] animate-slam
            ${isVictory 
                ? 'text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 stroke-white' 
                : 'text-red-600 stroke-black'
            }
          `}>
              {isVictory ? "VICTORY" : "DEFEAT"}
          </h2>
          
          <div className="animate-slow-fade flex flex-col items-center delay-700">
             <div className="w-32 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mb-6"></div>
             <p className="text-2xl text-slate-300 mb-10 text-center max-w-lg leading-relaxed font-light">
                 {notification}
             </p>
          </div>

          <div className={`transition-all duration-1000 flex flex-col gap-4 items-center ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <button 
                onClick={onReset}
                className={`
                    px-12 py-4 rounded-full text-xl font-bold tracking-widest uppercase transition-all duration-300
                    hover:scale-110 shadow-2xl cursor-pointer
                    ${isVictory 
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black ring-4 ring-yellow-400/30' 
                        : 'bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white ring-4 ring-red-500/30'
                    }
                `}
              >
                Play Again
              </button>

              <button 
                onClick={onGoHome}
                className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors uppercase tracking-widest text-sm font-bold"
              >
                 <Home size={16} /> Return Home
              </button>
          </div>
      </div>
    </div>
  );
};

export default GameOverScreen;
