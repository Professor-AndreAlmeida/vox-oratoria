import React, { useState } from 'react';
import { Session, GoalType, Challenge } from '../types';
import { JourneyIcon, TrophyIcon } from './icons';
import { ChallengeSummaryCard } from './ChallengeSummaryCard';
import { useGamification } from '../contexts/GamificationContext';
import Modal from './common/Modal';
import { Button } from './ui/button';

interface JourneyDashboardProps {
  sessions: Session[];
  onStartSkillDrill: (goalType: GoalType) => void;
}

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-card border border-card-border rounded-xl p-4 md:p-6 shadow-card ${className}`}>
    {children}
  </div>
);

export const JourneyDashboard: React.FC<JourneyDashboardProps> = ({ 
    sessions,
    onStartSkillDrill
}) => {
  const { challenges, activeChallenge } = useGamification();
  const [selectedHistoryChallenge, setSelectedHistoryChallenge] = useState<Challenge | null>(null);
  
  const completedChallenges = challenges.filter(c => c.status === 'completed').sort((a,b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime());

  return (
    <div className="w-full max-w-7xl animate-fade-in space-y-8">
      <div className="flex items-center gap-4">
        <JourneyIcon className="w-8 h-8 text-primary" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Minha Jornada</h2>
      </div>
      
      {/* Gráfico removido conforme solicitado para simplificar a UI */}

      <Card>
        <h3 className="text-xl font-bold mb-4">Desafio Ativo</h3>
        {activeChallenge ? (
            <ChallengeSummaryCard challenge={activeChallenge} onStartSkillDrill={onStartSkillDrill} />
        ) : (
          <div className="text-center py-8">
            <p className="text-text-secondary">Você não possui um desafio ativo no momento.</p>
            <p className="text-slate-500 mt-2">Visite o Painel e a IA irá sugerir um novo desafio para você!</p>
          </div>
        )}
      </Card>
      
      {completedChallenges.length > 0 && (
          <Card>
            <h3 className="text-xl font-bold mb-4">Conquistas</h3>
            <p className="text-sm text-text-secondary mb-4">Clique em uma conquista para ver os detalhes da missão cumprida.</p>
            <ul className="space-y-3">
                {completedChallenges.map(challenge => (
                     <li key={challenge.id}>
                        <button 
                            onClick={() => setSelectedHistoryChallenge(challenge)}
                            className="w-full flex items-center gap-4 p-4 bg-background/50 rounded-lg hover:bg-slate-700/50 border border-transparent hover:border-primary/30 transition-all duration-200 group text-left focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <TrophyIcon className="w-8 h-8 text-amber-400 flex-shrink-0 group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="font-bold text-lg text-text-primary group-hover:text-white transition-colors">{challenge.title}</p>
                                <p className="text-sm text-text-secondary">
                                    Concluído em {new Date(challenge.completedDate!).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                        </button>
                    </li>
                ))}
            </ul>
          </Card>
      )}

      {selectedHistoryChallenge && (
        <Modal
            isOpen={!!selectedHistoryChallenge}
            onClose={() => setSelectedHistoryChallenge(null)}
            title="Detalhes da Conquista"
            footer={<Button onClick={() => setSelectedHistoryChallenge(null)}>Fechar</Button>}
        >
            <div className="p-4">
                <ChallengeSummaryCard 
                    challenge={selectedHistoryChallenge} 
                    onStartSkillDrill={() => {}} // No-op para histórico, pois já está completo
                />
            </div>
        </Modal>
      )}
    </div>
  );
};