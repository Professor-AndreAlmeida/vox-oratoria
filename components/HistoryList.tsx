import React, { useState, useMemo } from 'react';
import { Session } from '../types';
import { HistoryIcon, EvolutionIcon, CoachIcon, TextFileIcon, StarIcon, TrashIcon, QAIconStandalone, Sparkles, JournalistIcon as SearchIcon } from './icons';
import { coaches } from '../coaches';

interface SessionItemProps {
    session: Session;
    onSelectSession: (session: Session) => void;
    onToggleFavorite: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
}

const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
};

export const SessionItem: React.FC<SessionItemProps> = ({ session, onSelectSession, onToggleFavorite, onDeleteSession }) => {
    const coach = coaches.find(c => c.id === session.coachId);
    const sessionTitle = session.title || `Sessão de ${formatDate(session.data)}`;
    const isCopilotSession = session.analysisMode === 'copilot';

    const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
        e.stopPropagation();
        action();
    };

    return (
        <div
            className={`relative p-4 bg-card border border-card-border rounded-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-primary hover:border-primary/50 ${session.isFavorite ? 'border-amber-400/50' : ''}`}
        >
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <button
                    onClick={() => onSelectSession(session)}
                    className="flex-1 text-left min-w-0 flex items-center gap-4 group"
                    aria-label={`Ver detalhes de ${sessionTitle}`}
                    disabled={isCopilotSession}
                >
                    <div className="flex-1 min-w-0">
                        <p className={`font-semibold mb-2 truncate ${isCopilotSession ? 'text-text-primary' : 'text-text-primary group-hover:text-primary transition-colors'}`} title={sessionTitle}>{sessionTitle}</p>
                        <div className="flex items-center gap-4 text-sm text-text-secondary flex-wrap">
                            {isCopilotSession ? (
                                <span className="flex items-center gap-1.5 font-semibold text-sky-300">
                                    <Sparkles className="w-4 h-4" />
                                    Sessão de Campo (Duração: {session.duracao})
                                </span>
                            ) : session.duracao === 'Texto' ? (
                                <span className="flex items-center gap-1.5">
                                    <TextFileIcon className="w-4 h-4" />
                                    Análise de Texto
                                </span>
                            ) : (
                                <span>Duração: {session.duracao}</span>
                            )}
                            {session.practiceAttempts && session.practiceAttempts.length > 0 && 
                                <span className="flex items-center gap-1.5 font-semibold text-purple-300">
                                    <EvolutionIcon className="w-4 h-4" />
                                    {session.practiceAttempts.length} Prática(s)
                                </span>
                            }
                            {session.qaInteractions && session.qaInteractions.length > 0 &&
                                <span className="flex items-center gap-1.5 font-semibold text-sky-300" title="Contém simulação de Q&A">
                                <QAIconStandalone className="w-4 h-4" />
                                Q&A
                                </span>
                            }
                        </div>
                        {coach && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded-full w-fit">
                                <CoachIcon className="w-4 h-4" />
                                <span>Coach: {coach.name}</span>
                            </div>
                        )}
                    </div>
                     {!isCopilotSession && (
                        <div className="text-primary opacity-0 sm:opacity-50 group-hover:opacity-100 transition-opacity ml-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                     )}
                </button>
                
                <div className="flex items-center gap-1 flex-shrink-0 self-end sm:self-center">
                    <button 
                        onClick={(e) => handleActionClick(e, () => onToggleFavorite(session.id))}
                        className={`p-2 rounded-full hover:bg-slate-700/50 transition-colors duration-300 z-10 ${session.isFavorite ? 'text-[#fff200]' : 'text-slate-500 hover:text-amber-400'}`}
                        aria-label={session.isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                    >
                        <StarIcon isFilled={!!session.isFavorite} />
                    </button>
                    <button 
                        onClick={(e) => handleActionClick(e, () => onDeleteSession(session.id))}
                        className="p-2 text-slate-500 hover:text-red-400 rounded-full hover:bg-slate-700/50 transition-colors duration-300 z-10"
                        aria-label="Excluir sessão"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface HistoryListProps {
  sessions: Session[];
  onSelectSession: (session: Session) => void;
  onToggleFavorite: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

type FilterType = 'all' | 'practice' | 'copilot';

const FilterButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-300 ${
            isActive
                ? 'bg-primary text-white'
                : 'bg-card text-text-secondary hover:bg-slate-700 hover:text-text-primary'
        }`}
    >
        {label}
    </button>
);

export const HistoryList: React.FC<HistoryListProps> = ({ sessions, onSelectSession, onToggleFavorite, onDeleteSession }) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAndSortedSessions = useMemo(() => {
    let displayedSessions = [...sessions];

    if (searchQuery.trim() !== '') {
        const lowercasedQuery = searchQuery.toLowerCase();
        displayedSessions = displayedSessions.filter(s => 
            (s.title || '').toLowerCase().includes(lowercasedQuery) ||
            s.transcricao.toLowerCase().includes(lowercasedQuery)
        );
    }

    if (showFavorites) {
        displayedSessions = displayedSessions.filter(s => s.isFavorite);
    }

    switch (filter) {
        case 'practice':
            displayedSessions = displayedSessions.filter(s => s.analysisMode !== 'copilot');
            break;
        case 'copilot':
            displayedSessions = displayedSessions.filter(s => s.analysisMode === 'copilot');
            break;
    }

    displayedSessions.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return new Date(b.data).getTime() - new Date(a.data).getTime();
    });

    return displayedSessions;
  }, [sessions, filter, showFavorites, searchQuery]);

  return (
    <div className="w-full max-w-7xl animate-fade-in">
      <div className="flex items-center gap-4 mb-8">
        <HistoryIcon className="w-8 h-8 text-primary" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Histórico de Sessões</h2>
      </div>

       <div className="p-4 bg-card border border-card-border rounded-lg mb-8 flex flex-col lg:flex-row items-center gap-4 shadow-card">
            <div className="flex items-center gap-2 flex-wrap justify-center">
                <FilterButton label="Todas" isActive={filter === 'all'} onClick={() => setFilter('all')} />
                <FilterButton label="Práticas" isActive={filter === 'practice'} onClick={() => setFilter('practice')} />
                <FilterButton label="Sessões de Campo" isActive={filter === 'copilot'} onClick={() => setFilter('copilot')} />
            </div>
            
            <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-4 lg:ml-auto">
                 <div className="relative w-full sm:w-64">
                    <input
                        type="text"
                        placeholder="Buscar no histórico..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-background/70 border border-slate-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-full hover:bg-slate-700/50 transition-colors flex-shrink-0">
                    <input
                        type="checkbox"
                        checked={showFavorites}
                        onChange={() => setShowFavorites(!showFavorites)}
                        className="w-4 h-4 rounded bg-slate-700 text-primary border-slate-600 focus:ring-primary focus:ring-offset-background"
                    />
                    <span className="text-sm font-medium text-text-primary">Apenas Favoritos</span>
                </label>
            </div>
        </div>

      {filteredAndSortedSessions.length > 0 ? (
        <ul className="space-y-4">
          {filteredAndSortedSessions.map(session => (
            <li key={session.id}>
                 <SessionItem 
                    session={session}
                    onSelectSession={onSelectSession}
                    onToggleFavorite={onToggleFavorite}
                    onDeleteSession={onDeleteSession}
                 />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center py-12 px-6 bg-card rounded-lg shadow-card">
          <p className="text-text-secondary">Nenhuma sessão encontrada com os filtros atuais.</p>
          <p className="text-slate-500 mt-2">Tente ajustar seus filtros ou comece uma nova sessão.</p>
        </div>
      )}
    </div>
  );
};