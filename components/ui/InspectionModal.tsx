import React from 'react';
import { Card, CardType, Character } from '../../types';
import CardComponent from '../CardComponent';
import { Shield, Skull, Heart } from 'lucide-react';

interface Props {
  item: Card | Character;
  onClose: () => void;
}

const InspectionModal: React.FC<Props> = ({ item, onClose }) => {
  const isCharacter = (i: any): i is Character => 'maxHealth' in i;

  return (
    <div 
        className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-lg flex items-center justify-center p-8 cursor-pointer"
        onClick={onClose}
    >
        <div className="flex flex-row items-center gap-12 animate-in zoom-in duration-300 max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="scale-125 flex-shrink-0 drop-shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                 {isCharacter(item) ? (
                    <div className="w-64 aspect-[5/7] rounded-xl border-4 border-yellow-600 bg-neutral-900 overflow-hidden relative shadow-2xl">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4 text-white">
                             <div className="font-fantasy text-2xl mb-1">{item.name}</div>
                             <div className="flex items-center gap-2 text-yellow-400 text-sm">
                                <Heart size={16} fill="currentColor" /> {item.currentHealth} / {item.maxHealth}
                             </div>
                        </div>
                    </div>
                 ) : (
                    <CardComponent card={item} className="w-64 aspect-[5/7]" disableHover={true} />
                 )}
            </div>
            
            <div className="bg-neutral-900 border border-yellow-900/30 p-8 rounded-none max-w-md text-left shadow-2xl relative">
                <div className="absolute -left-1 -top-1 w-4 h-4 border-t border-l border-yellow-500"></div>
                <div className="absolute -right-1 -bottom-1 w-4 h-4 border-b border-r border-yellow-500"></div>

                <div className="flex justify-between items-start mb-6 border-b border-neutral-800 pb-4">
                    <h2 className="text-4xl font-fantasy text-yellow-100">{item.name}</h2>
                    {!isCharacter(item) && (
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center bg-neutral-800 px-3 py-1 border border-neutral-700">
                                <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Cost</span>
                                <span className="font-bold text-yellow-500 text-lg">{item.cost}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                {isCharacter(item) ? (
                    <div className="inline-block bg-neutral-800 px-3 py-1 text-xs text-yellow-600 mb-6 uppercase tracking-widest border border-neutral-700">
                         Character
                    </div>
                ) : (
                    <div className="inline-block bg-neutral-800 px-3 py-1 text-xs text-yellow-600 mb-6 uppercase tracking-widest border border-neutral-700">
                         {item.type}
                    </div>
                )}
                
                <p className="text-xl text-neutral-300 leading-relaxed font-serif italic border-l-2 border-yellow-800 pl-4">
                    "{isCharacter(item) ? item.passive : item.description}"
                </p>
                
                {!isCharacter(item) && (
                    <div className="mt-8 pt-4 border-t border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
                        {item.canTargetBackline && "• Can target backline characters."}
                        {item.type === CardType.ATTACK && !item.canTargetBackline && "• Frontline Target Only."}
                    </div>
                )}
                
                {isCharacter(item) && (
                    <div className="mt-8 pt-4 border-t border-neutral-800 text-xs text-neutral-500 uppercase tracking-wider">
                         • Passive Ability Active
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default InspectionModal;