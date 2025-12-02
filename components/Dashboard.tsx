import React, { useState } from 'react';
import { Session, GoalType } from '../types';
import { RecordIcon, TargetIcon, LoadingIcon, AlertCircleIcon, EvolutionIcon } from './icons';
import { SessionItem } from './HistoryList';
import { ChallengeSuggestionModal } from './ChallengeSuggestionModal';
import { ChallengeSummaryCard } from './ChallengeSummaryCard';
import { Button } from './ui/button';
import { useUser } from '../contexts/UserContext';
import { useSettings } from '../contexts/SettingsContext';
import { useGamification } from '../contexts/GamificationContext';

interface DashboardProps {
    isFirstSession: boolean;
    firstSession: Session | null;
    recentSessions: Session[];
    onStartNewSession: () => void;
    onSelectSession: (session: Session) => void;
    onToggleFavorite: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onStartSkillDrill: (goalType: GoalType) => void;
    sessions: Session[];
    isGeneratingSummary: boolean;
    onGenerateWeeklySummary: () => void;
    onNavigateToSettings: () => void;
}

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`bg-card border border-card-border rounded-xl p-4 md:p-6 shadow-card h-full ${className}`}>
      {children}
    </div>
);

const ApiKeyNudgeCard: React.FC<{ onNavigateToSettings: () => void }> = ({ onNavigateToSettings }) => (
    <div className="w-full lg:col-span-2">
        <Card className="bg-gradient-to-br from-amber-500/20 to-card border-2 border-amber-500/50 text-center">
            <AlertCircleIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-text-primary">Ação Necessária: Configure sua API Key</h2>
            <p className="text-text-secondary mt-2 mb-6 max-w-xl mx-auto">
                Para habilitar as análises de IA, você precisa de uma API Key do Google Gemini. O processo é rápido, gratuito e sua chave fica salva apenas no seu navegador.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                 <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-3 px-6 py-3 bg-secondary rounded-full hover:bg-secondary-hover transition-all duration-300 font-semibold text-lg shadow-lg"
                >
                    Criar API Key Gratuita
                </a>
                 <Button onClick={onNavigateToSettings} variant="default" size="lg">
                    Já tenho uma, configurar
                </Button>
            </div>
        </Card>
    </div>
);
  
export const Dashboard: React.FC<DashboardProps> = ({
    recentSessions,
    onStartNewSession,
    onSelectSession,
    onToggleFavorite,
    onDeleteSession,
    onStartSkillDrill,
    sessions,
    isGeneratingSummary,
    onGenerateWeeklySummary,
    onNavigateToSettings,
}) => {
    const { user } = useUser();
    const { isApiKeySet } = useSettings();
    const { activeChallenge, suggestedChallenge, acceptChallenge, declineChallenge, isGeneratingChallenge, challenges } = useGamification();
    const [isAccepting, setIsAccepting] = useState(false);
    
    const handleAccept = async () => {
        if (!suggestedChallenge) return;
        setIsAccepting(true);
        await acceptChallenge(suggestedChallenge.id);
        setIsAccepting(false);
    };
    
    const handleDecline = () => {
        if (!suggestedChallenge) return;
        declineChallenge(suggestedChallenge.id);
    };
    
    const sessionsLast7Days = sessions.filter(s => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return new Date(s.data) >= oneWeekAgo;
    }).length;

    // Check if the latest challenge was declined to avoid showing "Analyzing..."
    const hasDeclinedLatest = challenges.length > 0 && challenges[0].status === 'declined';

    if (!user) {
        return <LoadingIcon className="w-8 h-8 animate-spin" />;
    }

    return (
        <div className="w-full max-w-7xl animate-fade-in space-y-8 md:space-y-12">
            {suggestedChallenge && isApiKeySet && (
                <ChallengeSuggestionModal 
                    challenge={suggestedChallenge}
                    onAccept={handleAccept}
                    onDecline={handleDecline}
                    isAccepting={isAccepting}
                />
            )}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Olá, {user.name.split(' ')[0]}!</h1>
                    <p className="text-base sm:text-lg text-text-secondary">Pronto para aprimorar sua comunicação?</p>
                </div>
                 <div className="flex flex-col sm:flex-row gap-3">
                     <button
                        onClick={onStartNewSession}
                        disabled={!isApiKeySet}
                        className="group inline-flex items-center justify-center gap-3 px-6 py-3 bg-primary rounded-full hover:bg-primary-hover transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RecordIcon className="w-6 h-6" />
                        Praticar
                    </button>
                 </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
                {!isApiKeySet && <ApiKeyNudgeCard onNavigateToSettings={onNavigateToSettings} />}

                {isApiKeySet && (
                     <>
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold flex items-center gap-3"><TargetIcon className="w-7 h-7 text-primary" /> Desafio Ativo</h2>
                                <Card>
                                    {activeChallenge ? (
                                        <ChallengeSummaryCard challenge={activeChallenge} onStartSkillDrill={onStartSkillDrill} />
                                    ) : isGeneratingChallenge ? (
                                        <div className="text-center py-8">
                                            <LoadingIcon className="w-8 h-8 text-primary mx-auto animate-spin mb-4" />
                                            <p className="text-text-secondary">O Agente de Carreira vOx está analisando seu progresso...</p>
                                            <p className="text-slate-500 mt-2 text-sm">Um novo desafio personalizado está sendo criado!</p>
                                        </div>
                                    ) : !suggestedChallenge && recentSessions.length > 1 && !hasDeclinedLatest ? (
                                        <div className="text-center py-8">
                                            <LoadingIcon className="w-8 h-8 text-slate-600 mx-auto mb-4" />
                                            <p className="text-text-secondary">Analisando histórico para novos desafios...</p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <TargetIcon className="w-8 h-8 text-slate-600 mx-auto mb-4" />
                                            <p className="text-text-secondary font-semibold">
                                                {suggestedChallenge ? 'Um novo desafio foi sugerido!' : (hasDeclinedLatest ? 'Desafio recusado.' : 'Continue praticando para desbloquear desafios!')}
                                            </p>
                                            <p className="text-slate-500 mt-2 text-sm">
                                                {suggestedChallenge 
                                                    ? 'Aceite-o para começar sua próxima missão.' 
                                                    : (hasDeclinedLatest ? 'Continue praticando e a IA sugerirá uma nova missão em breve.' : 'Após mais algumas sessões, a IA irá sugerir uma missão de carreira personalizada para você aqui.')
                                                }
                                            </p>
                                        </div>
                                    )}
                                </Card>
                            </div>

                            <div className="flex flex-col gap-4">
                                <h2 className="text-2xl font-bold flex items-center gap-3"><EvolutionIcon className="w-7 h-7" /> Relatórios</h2>
                                <Card>
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="font-bold text-lg">Sumário Executivo Semanal</h3>
                                            <p className="text-sm text-text-secondary">Receba uma análise da IA sobre seu progresso na última semana.</p>
                                        </div>
                                        <Button
                                            onClick={onGenerateWeeklySummary}
                                            isLoading={isGeneratingSummary}
                                            disabled={isGeneratingSummary || sessionsLast7Days < 2}
                                            title={sessionsLast7Days < 2 ? 'Você precisa de pelo menos 2 sessões na última semana' : 'Gerar Resumo'}
                                        >
                                            Gerar Resumo
                                        </Button>
                                    </div>
                                </Card>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-4 h-full">
                            <h2 className="text-2xl font-bold">Sessões Recentes</h2>
                            {recentSessions.length > 0 ? (
                                <div className="space-y-3">
                                    {recentSessions.map(session => (
                                        <SessionItem 
                                            key={session.id}
                                            session={session}
                                            onSelectSession={onSelectSession}
                                            onToggleFavorite={onToggleFavorite}
                                            onDeleteSession={onDeleteSession}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <Card className="flex items-center justify-center h-full min-h-[200px]">
                                    <div className="text-center py-8">
                                        <p className="text-text-secondary">Nenhuma sessão encontrada.</p>
                                        <p className="text-slate-500 mt-2">Sua primeira gravação aparecerá aqui.</p>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};