import React from 'react';
import { Settings, Flag, BookOpen, Play } from 'lucide-react';

interface Props {
  onConcede: () => void;
  onResume: () => void;
  onOpenLibrary: () => void;
}

const SettingsModal: React.FC<Props> = ({ onConcede, onResume, onOpenLibrary }) => {
  return (
    <div className="absolute inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200">
        <div className="bg-neutral-950 border border-yellow-900 p-10 shadow-[0_0_60px_rgba(0,0,0,0.9)] w-96 text-center animate-in zoom-in-95 duration-200 relative">
           {/* Gold Corners */}
           <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-yellow-600"></div>
           <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-yellow-600"></div>
           <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-yellow-600"></div>
           <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-yellow-600"></div>
           
           {/* Inner Border */}
           <div className="absolute inset-2 border border-yellow-900/20 pointer-events-none"></div>

           <h3 className="text-3xl font-fantasy text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-700 mb-8 flex justify-center items-center gap-3 drop-shadow-md">
             <Settings className="text-yellow-600" size={28} /> SETTINGS
           </h3>
           
           <div className="flex flex-col gap-4 relative z-10">
              <button 
                onClick={onOpenLibrary}
                className="group flex items-center justify-center gap-3 w-full py-4 bg-neutral-900 border border-neutral-800 hover:border-yellow-700 text-neutral-300 hover:text-yellow-400 transition-all uppercase tracking-widest text-xs font-bold shadow-lg"
              >
                <BookOpen size={16} className="text-neutral-500 group-hover:text-yellow-500 transition-colors" /> Card Library
              </button>

              <button 
                onClick={onResume}
                className="group flex items-center justify-center gap-3 w-full py-4 bg-neutral-900 border border-neutral-800 hover:border-yellow-700 text-neutral-300 hover:text-yellow-400 transition-all uppercase tracking-widest text-xs font-bold shadow-lg"
              >
                <Play size={16} className="text-neutral-500 group-hover:text-yellow-500 transition-colors" /> Resume Game
              </button>
              
              <div className="h-[1px] bg-neutral-800 my-2"></div>

              <button 
                onClick={onConcede}
                className="flex items-center justify-center gap-3 w-full py-4 bg-red-950/20 text-red-500 border border-red-900/50 hover:bg-red-900/40 hover:text-red-400 hover:border-red-800 transition-all uppercase tracking-widest text-xs font-bold shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]"
              >
                <Flag size={16} /> Concede Match
              </button>
           </div>
        </div>
    </div>
  );
};

export default SettingsModal;