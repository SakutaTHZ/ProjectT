import React, { useState } from 'react';
import { Card, CardType } from '../../types';
import { CARDS_DB } from '../../constants';
import CardComponent from '../CardComponent';
import { X, Search, Filter } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const CardLibraryModal: React.FC<Props> = ({ onClose }) => {
  const [filterType, setFilterType] = useState<CardType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCards = CARDS_DB.filter(card => {
    const matchesType = filterType === 'ALL' || card.type === filterType;
    const matchesSearch = card.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          card.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="absolute inset-0 z-[70] bg-black/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-yellow-900/30 flex justify-between items-center bg-neutral-900/50 sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <h2 className="text-3xl font-fantasy text-yellow-500 tracking-wider">Card Library</h2>
                <div className="h-8 w-[1px] bg-yellow-900/50"></div>
                <div className="text-neutral-500 text-sm font-serif italic">
                    {filteredCards.length} Cards Found
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-yellow-900/50"
            >
                <X size={24} />
            </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-4 bg-black/40 border-b border-neutral-900 flex flex-wrap gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-yellow-500 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Search cards..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 rounded-full py-2 pl-10 pr-4 text-sm text-yellow-100 focus:outline-none focus:border-yellow-600 focus:ring-1 focus:ring-yellow-600 transition-all w-64 placeholder:text-neutral-600"
                />
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                {['ALL', ...Object.values(CardType)].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as CardType | 'ALL')}
                        className={`
                            px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all whitespace-nowrap
                            ${filterType === type 
                                ? 'bg-yellow-900/40 border-yellow-600 text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                                : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'
                            }
                        `}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8 pb-20">
                {filteredCards.map((card) => (
                    <div key={card.id} className="flex flex-col gap-2 group">
                        <div className="relative transform transition-all duration-300 hover:scale-110 hover:z-10 hover:shadow-2xl">
                             <CardComponent 
                                card={card} 
                                className="w-full aspect-[5/7] shadow-lg"
                                disableHover // We handle hover scale on wrapper
                             />
                        </div>
                    </div>
                ))}
                {filteredCards.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                        <Filter size={48} className="text-neutral-600 mb-4" />
                        <p className="text-neutral-500 font-serif text-lg">No cards match your query.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default CardLibraryModal;