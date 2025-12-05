import React, { useState } from 'react';
import { Dices } from 'lucide-react';

interface Props {
  onRoll: (value: number) => void;
  disabled: boolean;
}

const DiceRoller: React.FC<Props> = ({ onRoll, disabled }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [displayValue, setDisplayValue] = useState(1);

  const handleRoll = () => {
    if (disabled || isRolling) return;
    setIsRolling(true);

    // Animation effect
    let count = 0;
    const interval = setInterval(() => {
      setDisplayValue(Math.floor(Math.random() * 3) + 1);
      count++;
      if (count > 10) {
        clearInterval(interval);
        const finalValue = Math.floor(Math.random() * 3) + 1;
        setDisplayValue(finalValue);
        setIsRolling(false);
        onRoll(finalValue);
      }
    }, 100);
  };

  return (
    <button
      onClick={handleRoll}
      disabled={disabled || isRolling}
      className={`
        relative group flex flex-col items-center justify-center w-20 h-20 rounded-full
        border-4 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300
        ${disabled 
          ? 'bg-slate-800 border-slate-600 opacity-50 cursor-not-allowed' 
          : 'bg-indigo-900 border-indigo-400 hover:scale-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] cursor-pointer'
        }
      `}
    >
      {isRolling ? (
         <Dices className="animate-spin text-white w-8 h-8" />
      ) : (
        <span className="text-3xl font-fantasy font-bold text-white drop-shadow-lg">
          {displayValue}
        </span>
      )}
      <span className="absolute -bottom-8 text-[10px] font-bold tracking-widest uppercase text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
        Roll Soul
      </span>
    </button>
  );
};

export default DiceRoller;
