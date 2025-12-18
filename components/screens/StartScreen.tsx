import React, { useState, useEffect } from 'react';
import { Play, BookOpen, Layers, Globe, Users, X, User } from 'lucide-react';

interface Props {
  onStart: (name: string) => void;
  onStartOnline: (name: string, roomId: string) => void;
  onOpenLibrary: () => void;
  onOpenDeckBuilder: () => void;
}

const StartScreen: React.FC<Props> = ({ onStart, onStartOnline, onOpenLibrary, onOpenDeckBuilder }) => {
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [playerName, setPlayerName] = useState(localStorage.getItem('soul_rotation_name') || 'SakutaTHZ');
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
      localStorage.setItem('soul_rotation_name', playerName);
  }, [playerName]);

  const handleOnlineJoin = () => {
      if(roomId.trim().length > 0) {
          onStartOnline(playerName, roomId);
      }
  };

  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
      
      {/* Gold Border Frame */}
      <div className="absolute inset-4 border border-yellow-900/30 pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 border-t-2 border-l-2 border-yellow-700/50"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 border-b-2 border-r-2 border-yellow-700/50"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000">
          <div className="flex flex-col items-center">
              <h1 className="text-6xl md:text-8xl font-fantasy text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 drop-shadow-[0_0_30px_rgba(234,179,8,0.4)] tracking-widest text-center">
              SOUL<br/>ROTATION
              </h1>
              <div className="w-64 h-[1px] bg-gradient-to-r from-transparent via-yellow-700 to-transparent mt-4"></div>
          </div>
          
          {/* Name Input Section */}
          <div className="flex flex-col items-center gap-2 bg-neutral-900/40 p-4 border border-yellow-900/20 backdrop-blur-sm">
             <div className="flex items-center gap-3 text-yellow-500/70 uppercase tracking-[0.2em] text-[10px] font-bold">
                 <User size={12} /> Identity Required
             </div>
             <input 
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.substring(0, 15))}
                className="bg-transparent border-b border-yellow-600/50 text-center py-1 text-xl font-fantasy text-yellow-200 focus:outline-none focus:border-yellow-400 transition-colors w-48"
                placeholder="Name..."
             />
          </div>
          
          <div className="flex flex-col gap-4 w-64">
              <button 
                onClick={onOpenDeckBuilder}
                className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-none transition-all cursor-pointer border border-yellow-900/50 hover:border-yellow-600"
              >
                 <div className="absolute inset-0 bg-neutral-900/80 group-hover:bg-neutral-800 transition-colors"></div>
                 <div className="relative flex items-center justify-center gap-3 text-yellow-600 group-hover:text-yellow-400">
                    <Layers size={18} />
                    <span className="font-bold uppercase tracking-widest text-sm">Forge Squad</span>
                 </div>
              </button>

              <button 
                onClick={onOpenLibrary}
                className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-none transition-all cursor-pointer border border-yellow-900/50 hover:border-yellow-600"
              >
                 <div className="absolute inset-0 bg-neutral-900/80 group-hover:bg-neutral-800 transition-colors"></div>
                 <div className="relative flex items-center justify-center gap-3 text-yellow-600 group-hover:text-yellow-400">
                    <BookOpen size={18} />
                    <span className="font-bold uppercase tracking-widest text-sm">Codex</span>
                 </div>
              </button>

              <button 
                onClick={() => setShowOnlineModal(true)}
                className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-none transition-all cursor-pointer border border-yellow-900/50 hover:border-yellow-600"
              >
                 <div className="absolute inset-0 bg-neutral-900/80 group-hover:bg-neutral-800 transition-colors"></div>
                 <div className="relative flex items-center justify-center gap-3 text-yellow-600 group-hover:text-yellow-400">
                    <Globe size={18} />
                    <span className="font-bold uppercase tracking-widest text-sm">Play Online</span>
                 </div>
              </button>

              <div className="h-[1px] bg-neutral-800 my-2"></div>

              <button 
                onClick={() => onStart(playerName)}
                className="group relative px-8 py-5 bg-transparent overflow-hidden rounded-none transition-all cursor-pointer"
              >
                <div className="absolute inset-0 bg-neutral-900 group-hover:bg-neutral-800 transition-colors"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                
                <div className="relative flex items-center justify-center gap-4">
                    <span className="text-xl font-bold uppercase tracking-[0.2em] text-yellow-500 group-hover:text-yellow-400 group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.8)] transition-all">
                        Vs AI
                    </span>
                    <Play size={20} className="text-yellow-600 group-hover:text-yellow-400 fill-current transition-colors" />
                </div>
              </button>
          </div>
      </div>
      
      {showOnlineModal && (
          <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center">
              <div className="bg-neutral-900 border border-yellow-700 p-8 relative w-96 shadow-2xl animate-in zoom-in duration-300">
                  <button onClick={() => setShowOnlineModal(false)} className="absolute top-2 right-2 text-neutral-500 hover:text-white"><X /></button>
                  <h2 className="text-2xl font-fantasy text-yellow-500 mb-6 flex items-center gap-2"><Globe /> Online Match</h2>
                  
                  <div className="flex flex-col gap-4">
                      <div>
                          <label className="text-xs text-neutral-400 uppercase tracking-wider mb-1 block">Room ID</label>
                          <input 
                            type="text" 
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="Enter Room Name..."
                            className="w-full bg-black border border-neutral-700 p-3 text-yellow-100 focus:border-yellow-500 outline-none placeholder:text-neutral-700"
                          />
                      </div>
                      
                      <button 
                        onClick={handleOnlineJoin}
                        className="mt-2 bg-yellow-700 hover:bg-yellow-600 text-black font-bold py-3 uppercase tracking-widest transition-colors"
                      >
                          Join / Create
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="absolute bottom-8 text-[10px] text-neutral-600 uppercase tracking-widest font-bold">
          Tactical TCG v1.4 • Soul Rotation
      </div>
    </div>
  );
};

export default StartScreen;