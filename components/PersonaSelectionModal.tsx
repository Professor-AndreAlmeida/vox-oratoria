import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import { InvestorIcon, ClientIcon, JournalistIcon, EditIcon, TrashIcon, PlusIcon, UserIcon } from './icons';
import { personas as defaultPersonas } from '../personas';
import * as db from '../services/dbService';
import { PersonaCreationModal } from './PersonaCreationModal';

interface PersonaSelectionModalProps {
  onSelectPersona: (persona: Persona) => void;
  onClose: () => void;
}

const PersonaCard: React.FC<{ persona: Persona; onSelect: () => void; onEdit?: () => void; onDelete?: () => void; }> = ({ persona, onSelect, onEdit, onDelete }) => {
    const getIcon = (p: Persona) => {
        const className = "w-12 h-12 text-primary mb-4";
        if (p.isCustom) return <UserIcon className={className} />;
        switch (p.id) {
            case 'investor': return <InvestorIcon className={className} />;
            case 'client': return <ClientIcon className={className} />;
            case 'journalist': return <JournalistIcon className={className} />;
            default: return null;
        }
    }
    
    return (
        <div className="relative group">
            <button 
                onClick={onSelect} 
                className="w-full h-full text-left p-6 bg-card border border-card-border rounded-lg shadow-card hover:shadow-card-hover hover:border-primary/50 transition-all duration-300 flex flex-col items-center text-center transform hover:-translate-y-1 hover:scale-[1.02]">
                {getIcon(persona)}
                <h3 className="font-bold text-text-primary">{persona.name}</h3>
                <p className="text-sm text-text-secondary mt-2 flex-grow">{persona.description}</p>
            </button>
            {persona.isCustom && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(); }} className="p-1.5 bg-slate-600/50 hover:bg-slate-500 rounded-full text-text-secondary hover:text-white" title="Editar Persona">
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="p-1.5 bg-slate-600/50 hover:bg-red-500 rounded-full text-text-secondary hover:text-white" title="Excluir Persona">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    )
};


export const PersonaSelectionModal: React.FC<PersonaSelectionModalProps> = ({ onSelectPersona, onClose }) => {
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [personaToEdit, setPersonaToEdit] = useState<Persona | null>(null);

  const loadPersonas = async () => {
    const savedPersonas = await db.getAllPersonas();
    setCustomPersonas(savedPersonas);
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  const openCreationModal = (persona?: Persona) => {
    setPersonaToEdit(persona || null);
    setIsCreationModalOpen(true);
  };

  const handleSavePersona = async (personaData: Omit<Persona, 'id'> | Persona) => {
    if ('id' in personaData && personaData.id) {
        await db.updatePersona(personaData as Persona);
    } else {
        await db.addPersona(personaData as Persona);
    }
    loadPersonas();
  };

  const handleDeletePersona = async (personaId: string) => {
    if (window.confirm("Tem certeza de que deseja excluir esta persona personalizada?")) {
        await db.deletePersona(personaId);
        loadPersonas();
    }
  };

  const allPersonas = [...defaultPersonas, ...customPersonas];

  return (
    <>
      <PersonaCreationModal 
        isOpen={isCreationModalOpen}
        onClose={() => setIsCreationModalOpen(false)}
        onSave={handleSavePersona}
        personaToEdit={personaToEdit}
      />
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 animate-fade-in p-4"
        onClick={onClose}
      >
        <div 
          className="bg-card-darker w-full max-w-4xl p-6 md:p-8 rounded-2xl border border-card-border shadow-2xl max-h-[95vh] overflow-y-auto"
          onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-text-primary">Escolha sua Audiência</h2>
          <p className="text-text-secondary text-center mb-8">Selecione uma persona para simular uma sessão de perguntas e respostas ou crie a sua própria.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allPersonas.map(persona => (
                  <PersonaCard 
                    key={persona.id} 
                    persona={persona} 
                    onSelect={() => onSelectPersona(persona)}
                    onEdit={() => openCreationModal(persona)}
                    onDelete={() => handleDeletePersona(persona.id)}
                   />
              ))}
               <button 
                  onClick={() => openCreationModal()}
                  className="w-full h-full text-left p-6 bg-card/50 border-2 border-dashed border-card-border rounded-lg hover:border-primary hover:bg-primary/10 transition-all duration-300 flex flex-col items-center justify-center text-center text-primary transform hover:-translate-y-1">
                  <PlusIcon className="w-12 h-12 mb-4" />
                  <h3 className="font-bold">Criar Nova Persona</h3>
              </button>
          </div>

          <div className="text-center mt-8">
              <button onClick={onClose} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
                  Cancelar
              </button>
          </div>
        </div>
      </div>
    </>
  );
};
