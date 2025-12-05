import React, { useState } from 'react';
import { ScrollText, X, Filter } from 'lucide-react';
import { LogEntry } from '../../types';

interface Props {
  logs: LogEntry[];
  show: boolean;
  onClose: () => void;
}

const GameLog: React.FC<Props> = ({ logs, show, onClose }) => {
  const [logFilters, setLogFilters] = useState({
    player: true,
    opponent: true,
    system: true
  });

  return (
    <div className={`
      absolute top-0 right-0 h-full w-96 bg-black/95 border-l border-yellow-900/30 shadow-2xl z-[52]
      transform transition-transform duration-300 flex flex-col backdrop-blur-xl
      ${show ? 'translate-x-0' : 'translate-x-full'}
    `}>
        <div className="p-4 border-b border-yellow-900/20 bg-neutral-900 sticky top-0 z-10">
           <div className="flex justify-between items-center mb-4">
               <h3 className="font-fantasy text-xl text-yellow-500 flex items-center gap-2">
                 <ScrollText size={20} /> Chronicles
               </h3>
               <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                  <X size={24} />
               </button>
           </div>
           {/* Filters */}
           <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500 flex items-center gap-1"><Filter size={12} /> Filter:</span>
              <button 
                onClick={() => setLogFilters(prev => ({ ...prev, player: !prev.player }))}
                className={`px-2 py-1 rounded border transition-colors ${logFilters.player ? 'bg-indigo-950 border-indigo-500 text-indigo-300' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
              >Player</button>
              <button 
                onClick={() => setLogFilters(prev => ({ ...prev, opponent: !prev.opponent }))}
                className={`px-2 py-1 rounded border transition-colors ${logFilters.opponent ? 'bg-red-950 border-red-500 text-red-300' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
              >Opponent</button>
              <button 
                onClick={() => setLogFilters(prev => ({ ...prev, system: !prev.system }))}
                className={`px-2 py-1 rounded border transition-colors ${logFilters.system ? 'bg-neutral-700 border-neutral-500 text-neutral-200' : 'bg-neutral-800 border-neutral-700 text-neutral-500'}`}
              >System</button>
           </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
           {logs.filter(l => logFilters[l.type]).length === 0 && (
               <div className="text-neutral-600 text-sm text-center italic mt-10 font-serif">
                   {logs.length === 0 ? "The pages are empty." : "No records found."}
               </div>
           )}
           {logs
              .filter(log => logFilters[log.type])
              .map((log) => (
              <div 
                  key={log.id} 
                  className={`
                      text-sm p-3 rounded border-l-2 transition-all hover:bg-white/5
                      ${log.type === 'player' ? 'border-indigo-500 bg-indigo-950/20' : ''}
                      ${log.type === 'opponent' ? 'border-red-500 bg-red-950/20' : ''}
                      ${log.type === 'system' ? 'border-yellow-600 bg-yellow-900/10 italic font-serif' : ''}
                  `}
              >
                 <div className="flex justify-between items-start mb-1 opacity-60 text-[10px] uppercase tracking-wider font-bold">
                     <div className="flex items-center gap-2">
                          <span className={`
                              ${log.type === 'player' ? 'text-indigo-400' : ''}
                              ${log.type === 'opponent' ? 'text-red-400' : ''}
                              ${log.type === 'system' ? 'text-yellow-600' : ''}
                          `}>
                              {log.type}
                          </span>
                          <span className="text-neutral-700">|</span>
                          <span className="text-neutral-500">Turn {log.turn}</span>
                     </div>
                     <span className="text-neutral-600">{log.timestamp}</span>
                 </div>
                 <div className={`
                     ${log.type === 'player' ? 'text-indigo-200' : ''}
                     ${log.type === 'opponent' ? 'text-red-200' : ''}
                     ${log.type === 'system' ? 'text-yellow-100/70' : ''}
                 `}>
                     {log.message}
                 </div>
              </div>
           ))}
        </div>
    </div>
  );
};

export default GameLog;