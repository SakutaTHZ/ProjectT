
import React, { useState, useEffect } from 'react';
import { Card, CardType, Character } from '../../types';
import { CARDS_DB, CHARACTERS_DB } from '../../constants';
import CardComponent from '../CardComponent';
import { ArrowLeft, Play, Sparkles, Trash2, Plus, AlertCircle, Users, Layers, Save } from 'lucide-react';

interface Props {
  onBack: () => void;
  onStartGame: (deck: Card[], characters: Character[]) => void;
}

const DECK_SIZE_LIMIT = 30;
const SQUAD_SIZE_LIMIT = 3;

type BuildTab = 'SQUAD' | 'DECK';

const DeckBuilderScreen: React.FC<Props> = ({ onBack, onStartGame }) => {
  const [activeTab, setActiveTab] = useState<BuildTab>('SQUAD');
  
  // Deck State
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [filterType, setFilterType] = useState<CardType | 'ALL'>('ALL');
  
  // Squad State
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedDeck = localStorage.getItem('soul_rotation_deck');
    const savedSquad = localStorage.getItem('soul_rotation_squad');

    if (savedDeck) {
        try {
            const parsedDeck = JSON.parse(savedDeck);
            if (Array.isArray(parsedDeck)) setCurrentDeck(parsedDeck);
        } catch (e) { console.error("Failed to load deck", e); }
    }

    if (savedSquad) {
         try {
            const parsedSquad = JSON.parse(savedSquad);
            if (Array.isArray(parsedSquad)) setSelectedCharacters(parsedSquad);
        } catch (e) { console.error("Failed to load squad", e); }
    }
  }, []);

  // --- Actions ---

  const saveLoadout = () => {
      localStorage.setItem('soul_rotation_deck', JSON.stringify(currentDeck));
      localStorage.setItem('soul_rotation_squad', JSON.stringify(selectedCharacters));
      // Visual feedback could be added here, for now a simple console log or button animation state
      const btn = document.getElementById('save-btn');
      if(btn) {
          const originalText = btn.innerHTML;
          btn.innerHTML = '<span class="text-green-400">Saved!</span>';
          setTimeout(() => { btn.innerHTML = originalText; }, 1500);
      }
  };

  const addToDeck = (card: Card) => {
    if (currentDeck.length >= DECK_SIZE_LIMIT) return;
    const deckCard = { ...card, id: `deck-${Math.random().toString(36).substr(2, 9)}` };
    setCurrentDeck(prev => [...prev, deckCard]);
  };

  const removeFromDeck = (index: number) => {
    const newDeck = [...currentDeck];
    newDeck.splice(index, 1);
    setCurrentDeck(newDeck);
  };

  const toggleCharacter = (char: Character) => {
      const exists = selectedCharacters.find(c => c.name === char.name);
      if (exists) {
          setSelectedCharacters(prev => prev.filter(c => c.name !== char.name));
      } else {
          if (selectedCharacters.length < SQUAD_SIZE_LIMIT) {
              setSelectedCharacters(prev => [...prev, char]);
          }
      }
  };

  const autoBuild = () => {
    // Auto Build Squad
    if (selectedCharacters.length < SQUAD_SIZE_LIMIT) {
        const available = CHARACTERS_DB.filter(c => !selectedCharacters.find(sc => sc.name === c.name));
        const needed = SQUAD_SIZE_LIMIT - selectedCharacters.length;
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, needed);
        setSelectedCharacters(prev => [...prev, ...picked]);
    }

    // Auto Build Deck
    const newDeck: Card[] = [...currentDeck];
    if (newDeck.length < DECK_SIZE_LIMIT) {
        const targetCounts = {
            [CardType.ATTACK]: 12,
            [CardType.HEAL]: 6,
            [CardType.TRAP]: 4,
            [CardType.UTILITY]: 4,
            [CardType.MANIPULATION]: 2,
            [CardType.DISCARD]: 2
        };
        const getRandomCard = (type: CardType) => {
            const candidates = CARDS_DB.filter(c => c.type === type);
            return candidates[Math.floor(Math.random() * candidates.length)];
        };

        const neededTotal = DECK_SIZE_LIMIT - newDeck.length;
        // Simple fill for now
        for(let i=0; i<neededTotal; i++) {
             const randomCard = CARDS_DB[Math.floor(Math.random() * CARDS_DB.length)];
             newDeck.push({ ...randomCard, id: `deck-${Math.random().toString(36).substr(2, 9)}` });
        }
        setCurrentDeck(newDeck);
    }
  };

  const clearAll = () => {
      if (activeTab === 'DECK') setCurrentDeck([]);
      if (activeTab === 'SQUAD') setSelectedCharacters([]);
  };

  const handleStart = () => {
      if (currentDeck.length === DECK_SIZE_LIMIT && selectedCharacters.length === SQUAD_SIZE_LIMIT) {
          // Auto-save on start
          saveLoadout();
          onStartGame(currentDeck, selectedCharacters);
      }
  };

  const filteredLibrary = CARDS_DB.filter(c => filterType === 'ALL' || c.type === filterType);
  const sortedDeck = [...currentDeck].sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

  const isDeckValid = currentDeck.length === DECK_SIZE_LIMIT;
  const isSquadValid = selectedCharacters.length === SQUAD_SIZE_LIMIT;

  return (
    <div className="w-full h-screen bg-black text-amber-100 flex flex-col overflow-hidden relative">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black -z-10"></div>
       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] -z-10"></div>

       {/* Header */}
       <div className="h-20 border-b border-yellow-900/30 bg-neutral-900/50 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                <ArrowLeft size={24} />
             </button>
             <h1 className="text-3xl font-fantasy text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 tracking-wider">
                SQUAD FORGE
             </h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Tabs */}
             <div className="flex bg-neutral-900 border border-neutral-800 rounded-full p-1 mr-8">
                 <button 
                    onClick={() => setActiveTab('SQUAD')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'SQUAD' ? 'bg-yellow-700 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                 >
                    <Users size={14} /> Squad ({selectedCharacters.length}/{SQUAD_SIZE_LIMIT})
                 </button>
                 <button 
                    onClick={() => setActiveTab('DECK')}
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'DECK' ? 'bg-yellow-700 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
                 >
                    <Layers size={14} /> Deck ({currentDeck.length}/{DECK_SIZE_LIMIT})
                 </button>
             </div>

             <button 
                onClick={handleStart}
                disabled={!isDeckValid || !isSquadValid}
                className={`
                   flex items-center gap-2 px-8 py-3 rounded-none uppercase tracking-widest font-bold border transition-all
                   ${isDeckValid && isSquadValid
                      ? 'bg-yellow-600 hover:bg-yellow-500 text-black border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-105' 
                      : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
                   }
                `}
             >
                <Play size={18} fill="currentColor" /> Start Match
             </button>
          </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT: Selection Area */}
          <div className="w-8/12 flex flex-col border-r border-yellow-900/20 bg-neutral-950/50">
             
             {activeTab === 'DECK' && (
                 <>
                    <div className="p-4 flex gap-2 overflow-x-auto border-b border-neutral-800 custom-scrollbar">
                        {['ALL', ...Object.values(CardType)].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type as CardType | 'ALL')}
                                className={`
                                    px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap
                                    ${filterType === type 
                                        ? 'bg-yellow-900/40 border-yellow-600 text-yellow-500' 
                                        : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'
                                    }
                                `}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {filteredLibrary.map((card) => (
                            <div key={card.id} className="group relative">
                                <div className="transform transition-all duration-300 group-hover:scale-105 group-hover:z-10 group-hover:shadow-xl">
                                    <CardComponent 
                                        card={card} 
                                        className="w-full aspect-[5/7] shadow-lg" 
                                        disableHover
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                        <button 
                                            onClick={() => addToDeck(card)}
                                            disabled={currentDeck.length >= DECK_SIZE_LIMIT}
                                            className="bg-yellow-600 text-black p-3 rounded-full hover:scale-110 transition-transform shadow-[0_0_15px_rgba(234,179,8,0.6)] disabled:bg-neutral-700 disabled:text-neutral-500"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center mt-2 text-xs font-bold text-neutral-500 group-hover:text-yellow-500 transition-colors uppercase tracking-wider">
                                    Cost {card.cost}
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>
                 </>
             )}

             {activeTab === 'SQUAD' && (
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                     <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                         {CHARACTERS_DB.map(char => {
                             const isSelected = selectedCharacters.some(c => c.name === char.name);
                             return (
                                 <div 
                                    key={char.id} 
                                    onClick={() => toggleCharacter(char)}
                                    className={`
                                        relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 group aspect-[5/7]
                                        ${isSelected ? 'border-yellow-500 ring-4 ring-yellow-500/30 scale-105 z-10' : 'border-neutral-800 hover:border-yellow-600/50 hover:scale-105 opacity-80 hover:opacity-100'}
                                    `}
                                 >
                                     <img src={char.image} className="w-full h-full object-cover" alt={char.name} />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                     <div className="absolute top-2 right-2">
                                         {isSelected && <div className="bg-yellow-500 text-black p-1 rounded-full shadow-lg"><Plus size={16} className="rotate-45" /></div>}
                                     </div>
                                     <div className="absolute bottom-0 left-0 w-full p-4">
                                         <div className="font-fantasy text-2xl text-white mb-1">{char.name}</div>
                                         <div className="text-xs text-yellow-500 font-bold uppercase tracking-wider mb-2">HP: {char.maxHealth}</div>
                                         <div className="text-[10px] text-neutral-400 font-serif italic border-l border-yellow-700 pl-2">
                                             "{char.passive}"
                                         </div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}

          </div>

          {/* RIGHT: Selected View */}
          <div className="w-4/12 flex flex-col bg-black/80 border-l border-yellow-900/30">
              <div className="p-4 border-b border-yellow-900/20 flex justify-between items-center bg-neutral-900">
                 <h2 className="text-xl font-fantasy text-yellow-500 tracking-wider">
                     {activeTab === 'SQUAD' ? 'Selected Squad' : 'Selected Deck'}
                 </h2>
                 <div className="flex gap-2">
                    <button id="save-btn" onClick={saveLoadout} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-emerald-950/30 text-emerald-400 border border-emerald-900 hover:bg-emerald-900/50 transition-all rounded">
                       <Save size={14} /> Save
                    </button>
                    <button onClick={autoBuild} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-indigo-900/30 text-indigo-400 border border-indigo-900 hover:bg-indigo-900/50 transition-all rounded">
                       <Sparkles size={14} /> Auto
                    </button>
                    <button onClick={clearAll} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest bg-red-950/30 text-red-500 border border-red-900 hover:bg-red-900/50 transition-all rounded">
                       <Trash2 size={14} /> Clear
                    </button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {activeTab === 'SQUAD' && (
                      <div className="flex flex-col gap-4">
                          {selectedCharacters.length === 0 && <p className="text-neutral-500 italic text-center mt-10">Select 3 champions.</p>}
                          {selectedCharacters.map((char, idx) => (
                              <div key={idx} className="flex items-center gap-4 bg-neutral-900 p-3 rounded border border-neutral-800">
                                  <img src={char.image} className="w-12 h-12 object-cover rounded border border-neutral-700" alt={char.name}/>
                                  <div className="flex-1">
                                      <div className="font-fantasy text-yellow-100">{char.name}</div>
                                      <div className="text-xs text-neutral-500">Position {idx === 0 ? 'Front' : (idx === 1 ? 'Right' : 'Left')}</div>
                                  </div>
                                  <button onClick={() => toggleCharacter(char)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                              </div>
                          ))}
                      </div>
                  )}

                  {activeTab === 'DECK' && (
                      <div className="space-y-2">
                          {sortedDeck.map((card, index) => (
                             <div 
                                key={card.id + index} 
                                className="flex items-center gap-3 p-2 bg-neutral-900/50 border border-neutral-800 hover:border-red-900 hover:bg-red-950/10 rounded group transition-all cursor-pointer"
                                onClick={() => removeFromDeck(index)}
                             >
                                <div className="w-8 h-8 flex items-center justify-center bg-neutral-950 border border-neutral-700 rounded font-fantasy text-yellow-600 font-bold">{card.cost}</div>
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-neutral-300 group-hover:text-red-400 transition-colors">{card.name}</div>
                                    <div className="text-[10px] text-neutral-600 uppercase tracking-wider">{card.type}</div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 size={16} /></div>
                             </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
       </div>
    </div>
  );
};

export default DeckBuilderScreen;
