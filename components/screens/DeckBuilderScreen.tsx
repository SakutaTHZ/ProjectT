import React, { useState, useEffect } from 'react';
import { Card, CardType, Character, DeckLoadout } from '../../types';
import { CARDS_DB, CHARACTERS_DB, PREBUILT_DECKS } from '../../constants';
import CardComponent from '../CardComponent';
import { ArrowLeft, Play, Sparkles, Trash2, Plus, AlertCircle, Users, Layers, Save, Info, Bookmark } from 'lucide-react';

interface Props {
  onBack: () => void;
  onStartGame: (deck: Card[], characters: Character[]) => void;
}

const DECK_SIZE_LIMIT = 30;
const SQUAD_SIZE_LIMIT = 3;

type BuildTab = 'SQUAD' | 'DECK';

const DeckBuilderScreen: React.FC<Props> = ({ onBack, onStartGame }) => {
  const [activeTab, setActiveTab] = useState<BuildTab>('SQUAD');
  const [notification, setNotification] = useState<string | null>(null);
  const [currentSlot, setCurrentSlot] = useState<number>(1);
  
  // Deck State
  const [currentDeck, setCurrentDeck] = useState<Card[]>([]);
  const [filterType, setFilterType] = useState<CardType | 'ALL'>('ALL');
  
  // Squad State
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);

  // Load from local storage based on slot
  useEffect(() => {
    const saved = localStorage.getItem(`soul_deck_slot_${currentSlot}`);
    if (saved) {
        try {
            const parsed = JSON.parse(saved) as DeckLoadout;
            setCurrentDeck(parsed.cards || []);
            setSelectedCharacters(parsed.squad || []);
        } catch (e) { 
            console.error("Failed to load deck", e); 
            setCurrentDeck([]);
            setSelectedCharacters([]);
        }
    } else {
        setCurrentDeck([]);
        setSelectedCharacters([]);
    }
  }, [currentSlot]);

  const showNotification = (msg: string) => {
      setNotification(msg);
      setTimeout(() => setNotification(null), 3000);
  };

  const saveLoadout = () => {
      const data: DeckLoadout = { name: `Custom Slot ${currentSlot}`, cards: currentDeck, squad: selectedCharacters };
      localStorage.setItem(`soul_deck_slot_${currentSlot}`, JSON.stringify(data));
      showNotification("Loadout Saved!");
  };

  const loadPrebuilt = (key: keyof typeof PREBUILT_DECKS) => {
      const pre = PREBUILT_DECKS[key];
      setCurrentDeck([...pre.cards]);
      setSelectedCharacters([...pre.squad]);
      showNotification(`${pre.name} Loaded!`);
  };

  const addToDeck = (card: Card) => {
    if (currentDeck.length >= DECK_SIZE_LIMIT) {
        showNotification("Deck Full!");
        return;
    }
    const copies = currentDeck.filter(c => c.name === card.name).length;
    if (copies >= 3) {
        showNotification("Max 3 copies allowed!");
        return;
    }

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

  const clearAll = () => {
      if (activeTab === 'DECK') setCurrentDeck([]);
      if (activeTab === 'SQUAD') setSelectedCharacters([]);
  };

  const handleStart = () => {
      if (currentDeck.length === DECK_SIZE_LIMIT && selectedCharacters.length === SQUAD_SIZE_LIMIT) {
          saveLoadout();
          // Pass the actual current state to start the game
          onStartGame(currentDeck, selectedCharacters);
      } else {
          showNotification(`Need ${DECK_SIZE_LIMIT} cards and ${SQUAD_SIZE_LIMIT} characters!`);
      }
  };

  const filteredLibrary = CARDS_DB.filter(c => filterType === 'ALL' || c.type === filterType);
  const sortedDeck = [...currentDeck].sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));

  return (
    <div className="w-full h-screen bg-black text-amber-100 flex flex-col overflow-hidden relative">
       <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-black to-black -z-10"></div>
       
       {notification && (
           <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-yellow-900/90 text-black px-6 py-3 rounded-full border border-yellow-500 shadow-xl flex items-center gap-2 animate-in fade-in zoom-in duration-200">
               <span className="font-bold uppercase tracking-widest text-xs">{notification}</span>
           </div>
       )}

       {/* Header */}
       <div className="h-20 border-b border-yellow-900/30 bg-neutral-900/50 backdrop-blur-md flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white">
                <ArrowLeft size={24} />
             </button>
             <h1 className="text-2xl font-fantasy text-yellow-500 tracking-wider">SQUAD FORGE</h1>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Tabs */}
             <div className="flex bg-neutral-900 border border-neutral-800 rounded-full p-1 mr-8">
                 <button onClick={() => setActiveTab('SQUAD')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'SQUAD' ? 'bg-yellow-700 text-white' : 'text-neutral-500'}`}>Squad ({selectedCharacters.length}/{SQUAD_SIZE_LIMIT})</button>
                 <button onClick={() => setActiveTab('DECK')} className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'DECK' ? 'bg-yellow-700 text-white' : 'text-neutral-500'}`}>Deck ({currentDeck.length}/{DECK_SIZE_LIMIT})</button>
             </div>

             <button 
                onClick={handleStart}
                disabled={currentDeck.length !== DECK_SIZE_LIMIT || selectedCharacters.length !== SQUAD_SIZE_LIMIT}
                className={`flex items-center gap-2 px-8 py-3 rounded uppercase tracking-widest font-bold border transition-all ${currentDeck.length === DECK_SIZE_LIMIT && selectedCharacters.length === SQUAD_SIZE_LIMIT ? 'bg-yellow-600 hover:bg-yellow-500 text-black border-yellow-400' : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'}`}
             >
                <Play size={18} fill="currentColor" /> Play
             </button>
          </div>
       </div>

       {/* Sub-Header: Slots & Prebuilts */}
       <div className="h-14 border-b border-neutral-900 bg-black/40 flex items-center px-8 justify-between">
            <div className="flex items-center gap-4">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Custom Slots:</span>
                {[1, 2, 3].map(s => (
                    <button key={s} onClick={() => setCurrentSlot(s)} className={`w-8 h-8 rounded border transition-all font-bold text-xs flex items-center justify-center ${currentSlot === s ? 'bg-yellow-900/40 border-yellow-600 text-yellow-500' : 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700'}`}>{s}</button>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold mr-2">Archetypes:</span>
                <button onClick={() => loadPrebuilt('DAMAGE')} className="px-3 py-1 bg-red-950/20 border border-red-900 text-red-500 text-[10px] uppercase font-bold hover:bg-red-900/40 transition-colors rounded">Damage</button>
                <button onClick={() => loadPrebuilt('HEAL')} className="px-3 py-1 bg-emerald-950/20 border border-emerald-900 text-emerald-500 text-[10px] uppercase font-bold hover:bg-emerald-900/40 transition-colors rounded">Heal</button>
                <button onClick={() => loadPrebuilt('TRAP')} className="px-3 py-1 bg-orange-950/20 border border-orange-900 text-orange-500 text-[10px] uppercase font-bold hover:bg-orange-900/40 transition-colors rounded">Trap</button>
            </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 flex overflow-hidden">
          <div className="w-8/12 flex flex-col border-r border-yellow-900/20 bg-neutral-950/50">
             {activeTab === 'DECK' && (
                 <>
                    <div className="p-4 flex gap-2 overflow-x-auto border-b border-neutral-800 custom-scrollbar">
                        {['ALL', ...Object.values(CardType)].map((type) => (
                            <button key={type} onClick={() => setFilterType(type as CardType | 'ALL')} className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap ${filterType === type ? 'bg-yellow-900/40 border-yellow-600 text-yellow-500' : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600'}`}>{type}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-6">
                        {filteredLibrary.map((card) => {
                             const count = currentDeck.filter(c => c.name === card.name).length;
                             const isMaxed = count >= 3;
                             return (
                                <div key={card.id} className={`group relative ${isMaxed ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="transform transition-all duration-300 group-hover:scale-105">
                                        <CardComponent card={card} className="w-full aspect-[5/7]" disableHover />
                                        {!isMaxed && (
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                                <button onClick={() => addToDeck(card)} className="bg-yellow-600 text-black p-3 rounded-full hover:scale-110"><Plus size={24} /></button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-1">
                                        <span>Cost {card.cost}</span>
                                        <span className={count > 0 ? 'text-yellow-500' : ''}>{count}/3</span>
                                    </div>
                                </div>
                             );
                        })}
                        </div>
                    </div>
                 </>
             )}

             {activeTab === 'SQUAD' && (
                 <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                     <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                         {CHARACTERS_DB.map(char => {
                             const isSelected = selectedCharacters.some(c => c.name === char.name);
                             return (
                                 <div key={char.id} onClick={() => toggleCharacter(char)} className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 group aspect-[5/7] ${isSelected ? 'border-yellow-500 ring-4 ring-yellow-500/30 scale-105' : 'border-neutral-800 hover:border-yellow-600/50'}`}>
                                     <img src={char.image} className="w-full h-full object-cover" alt={char.name} />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                                     <div className="absolute bottom-0 left-0 w-full p-4">
                                         <div className="font-fantasy text-xl text-white mb-1">{char.name}</div>
                                         <div className="text-[10px] text-neutral-400 font-serif italic border-l border-yellow-700 pl-2">"{char.passive}"</div>
                                     </div>
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             )}
          </div>

          <div className="w-4/12 flex flex-col bg-black/80 border-l border-yellow-900/30">
              <div className="p-4 border-b border-yellow-900/20 flex justify-between items-center bg-neutral-900">
                 <h2 className="text-sm font-fantasy text-yellow-500 tracking-wider">LOADOUT SLOT {currentSlot}</h2>
                 <div className="flex gap-2">
                    <button onClick={saveLoadout} className="p-1.5 bg-emerald-950/30 text-emerald-400 border border-emerald-900 hover:bg-emerald-900/50 transition-all rounded"><Save size={14} /></button>
                    <button onClick={clearAll} className="p-1.5 bg-red-950/30 text-red-500 border border-red-900 hover:bg-red-900/50 transition-all rounded"><Trash2 size={14} /></button>
                 </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                  {activeTab === 'SQUAD' && (
                      <div className="flex flex-col gap-2">
                          {selectedCharacters.map((char, idx) => (
                              <div key={idx} className="flex items-center gap-3 bg-neutral-900 p-2 rounded border border-neutral-800">
                                  <img src={char.image} className="w-10 h-10 object-cover rounded border border-neutral-700" alt={char.name}/>
                                  <div className="flex-1 font-fantasy text-yellow-100 text-xs">{char.name}</div>
                                  <button onClick={() => setSelectedCharacters(prev => prev.filter(c => c.name !== char.name))} className="text-red-500"><Trash2 size={14} /></button>
                              </div>
                          ))}
                      </div>
                  )}

                  {activeTab === 'DECK' && (
                      <div className="space-y-1">
                          {sortedDeck.map((card, index) => (
                             <div key={card.id + index} className="flex items-center gap-2 p-1.5 bg-neutral-900/50 border border-neutral-800 hover:border-red-900 rounded group transition-all cursor-pointer" onClick={() => removeFromDeck(index)}>
                                <div className="w-6 h-6 flex items-center justify-center bg-neutral-950 border border-neutral-700 rounded font-fantasy text-yellow-600 text-[10px] font-bold">{card.cost}</div>
                                <div className="flex-1 text-xs text-neutral-300">{card.name}</div>
                                <div className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 size={12} /></div>
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