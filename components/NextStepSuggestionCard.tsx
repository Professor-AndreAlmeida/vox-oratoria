import React from 'react';
import { NextStepSuggestion, GoalType, Persona } from '../types';
import { Lightbulb, RecordIcon, QAIconStandalone } from './icons';
import { personas } from '../personas';

interface NextStepSuggestionCardProps {
  suggestion: NextStepSuggestion;
  onStartSkillDrill: (goalType: GoalType) => void;
  onStartQASimulation: (persona: Persona) => void;
  onOpenPersonaSelection: () => void;
}

const NextStepSuggestionCard: React.FC<NextStepSuggestionCardProps> = ({ suggestion, onStartSkillDrill, onStartQASimulation, onOpenPersonaSelection }) => {
  const isSkillDrill = suggestion.type === 'skill_drill';
  const buttonIcon = isSkillDrill ? <RecordIcon className="w-5 h-5" /> : <QAIconStandalone className="w-5 h-5" />;
  
  let buttonText = 'Iniciar Ação';
  
  if (isSkillDrill) {
      const type = suggestion.context?.goalType;
      let label = 'de Habilidade';
      
      switch (type) {
          case 'clarity': label = 'de Clareza'; break;
          case 'filler_words': label = 'de Vícios de Linguagem'; break;
          case 'wpm': label = 'de Ritmo'; break;
          case 'intonation_variety': label = 'de Entonação'; break;
      }
      
      buttonText = `Iniciar Treino ${label}`;
  } else {
      const persona = personas.find(p => p.id === suggestion.context?.personaId);
      buttonText = persona ? `Simular com ${persona.name}` : 'Iniciar Simulação Q&A';
  }

  const handleAccept = () => {
    if (isSkillDrill && suggestion.context?.goalType) {
      onStartSkillDrill(suggestion.context.goalType);
    } else if (suggestion.type === 'qa_simulation') {
      if (suggestion.context?.personaId) {
          const persona = personas.find(p => p.id === suggestion.context.personaId);
          if (persona) {
              onStartQASimulation(persona);
              return;
          }
      }
      // Fallback: Open selection modal if no specific persona is found or suggested
      onOpenPersonaSelection();
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-indigo-500/20 to-card border border-indigo-500/50 rounded-lg animate-fade-in">
        <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-6">
            <div className="text-primary flex-shrink-0">
                <Lightbulb className="w-10 h-10" />
            </div>
            <div className="flex-grow">
                <h3 className="text-xl font-bold text-text-primary">Próximo Passo Sugerido</h3>
                <p className="text-text-secondary mt-1">{suggestion.reason}</p>
            </div>
            <div className="flex-shrink-0 w-full md:w-auto">
                <button 
                    onClick={handleAccept}
                    className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover rounded-full font-semibold transition-colors duration-300"
                >
                    {buttonIcon}
                    {buttonText}
                </button>
            </div>
        </div>
    </div>
  );
};

export default NextStepSuggestionCard;