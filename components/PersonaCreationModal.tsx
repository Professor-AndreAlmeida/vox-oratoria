import React, { useState, useEffect } from 'react';
import { Persona } from '../types';
import Modal from './common/Modal';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface PersonaCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (persona: Omit<Persona, 'id'> | Persona) => void;
  personaToEdit?: Persona | null;
}

export const PersonaCreationModal: React.FC<PersonaCreationModalProps> = ({ isOpen, onClose, onSave, personaToEdit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (personaToEdit) {
      setName(personaToEdit.name);
      setDescription(personaToEdit.description);
    } else {
      setName('');
      setDescription('');
    }
  }, [personaToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;

    if (personaToEdit) {
      onSave({ ...personaToEdit, name, description });
    } else {
      onSave({
        id: crypto.randomUUID(),
        name,
        description,
        isCustom: true,
      });
    }
    onClose();
  };
  
  const modalTitle = personaToEdit ? 'Editar Persona' : 'Criar Nova Persona';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
        <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-4">
                <div>
                    <Label htmlFor="persona-name">Nome da Persona</Label>
                    <Input
                        id="persona-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Chefe Exigente, Cliente Cético"
                        required
                        className="mt-1"
                    />
                </div>
                <div>
                    <Label htmlFor="persona-description">Descrição e Comportamento</Label>
                    <textarea
                        id="persona-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva como essa persona pensa, age e quais são seus principais pontos de foco ou objeções. A IA usará isso para simular o comportamento."
                        required
                        className="w-full mt-1 h-32 p-3 bg-background border border-input rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    />
                     <p className="text-xs text-muted-foreground mt-1">Quanto mais detalhes, mais realista será a simulação.</p>
                </div>
            </div>
             <footer className="p-4 border-t-2 border-border flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
                <Button type="submit">Salvar Persona</Button>
            </footer>
        </form>
    </Modal>
  );
};
