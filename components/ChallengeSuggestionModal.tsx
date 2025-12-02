import React from 'react';
import { Challenge, Milestone } from '../types';
import { TargetIcon, FlagIcon, LoadingIcon } from './icons';

interface ChallengeSuggestionModalProps {
  challenge: Challenge;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting: boolean;
}

const MilestoneItem: React.FC<{ milestone: Milestone }> = ({ milestone }) => (
    <div className="flex items-start gap-3 text-left">
        <FlagIcon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
        <p className="text-text-secondary">{milestone.description}</p>
    </div>
);

export const ChallengeSuggestionModal: React.FC<ChallengeSuggestionModalProps> = ({ challenge, onAccept, onDecline, isAccepting }) => {
  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 animate-fade-in p-4"
      onClick={onDecline}
    >
      <div 
        className="bg-card w-full max-w-lg p-6 md:p-8 rounded-2xl border-2 border-primary/50 shadow-2xl max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
            <TargetIcon className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary">O vOx tem uma proposta para você</h2>
            <h3 className="text-xl font-semibold text-primary mt-2 mb-4">{challenge.title}</h3>
        </div>
        
        <p className="text-text-secondary text-center mb-6">{challenge.narrative}</p>

        <div className="space-y-4 mb-8">
            {challenge.milestones.map((milestone, index) => (
                <MilestoneItem key={index} milestone={milestone} />
            ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
                onClick={onDecline} 
                disabled={isAccepting}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-500 rounded-full font-semibold transition-colors duration-300 disabled:opacity-50"
            >
                Talvez mais tarde
            </button>
            <button 
                onClick={onAccept}
                disabled={isAccepting}
                className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-full font-semibold transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isAccepting && <LoadingIcon className="w-5 h-5 animate-spin" />}
                Aceitar Desafio
            </button>
        </div>
      </div>
    </div>
  );
};