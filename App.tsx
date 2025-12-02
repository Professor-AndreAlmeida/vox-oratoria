import React, { useState, useCallback, useEffect } from 'react';
import { Recorder } from './components/Recorder';
import { HistoryList } from './components/HistoryList';
import AnalysisReportComponent from './components/AnalysisReport';
import { NewSessionSetup } from './components/CoachSelection';
import { JourneyDashboard } from './components/JourneyDashboard';
import { QASimulation } from './components/QASimulation';
import { Dashboard } from './components/Dashboard';
import { SharedReportViewer } from './components/SharedReportViewer';
import PulpitMode from './components/PulpitMode';
import { SkillDrill } from './components/SkillDrill';
import { Session, PracticeAttempt, Persona, QAInteraction, AnalysisMode, GoalType, PreGeneratedDrills, NextStepSuggestion, UsageStats } from './types';
import { LogoIcon, HistoryIcon, JourneyIcon, DashboardIcon, LogoutIcon, MenuIcon, CloseIcon, BookOpenIcon, SettingsIcon } from './components/icons';
import { generateSkillDrillExercise, generateNextStepSuggestion, generateSuggestionFromQA, generateWeeklySummary } from './services/geminiService';
import Modal from './components/common/Modal';
import MarkdownViewer from './components/common/MarkdownViewer';

import { TutorialPage } from './components/TutorialPage';
import { ChatWidget } from './components/ChatWidget';
import { SettingsPage } from './components/SettingsPage';
import { LandingPage } from './components/auth/LandingPage';
import { PrivacyPolicyPage } from './components/legal/PrivacyPolicyPage';
import { TermsOfUsePage } from './components/legal/TermsOfUsePage';
import { LegalLayout } from './components/legal/LegalLayout';
import { LoginPage } from './components/auth/LoginPage';
import { useUser } from './contexts/UserContext';
import { useSettings } from './contexts/SettingsContext';
import { useToast } from './components/common/Toast';
import { useSession } from './contexts/SessionContext';
import { useGamification } from './contexts/GamificationContext';

type AppState = 'dashboard' | 'new_session_setup' | 'recording_scripted' | 'recording_freestyle' | 'viewing_report' | 'viewing_history' | 'viewing_journey' | 'in_qa_simulation' | 'viewing_shared_report' | 'skill_drill' | 'viewing_tutorial' | 'viewing_settings';
type UnauthenticatedView = 'landing' | 'privacy' | 'terms' | 'login';

interface PracticeContext {
  session: Session;
  previousTranscript: string;
}
interface ScriptedPracticeContext {
  coachId?: string;
  script: string;
}
interface QAContext {
  session: Session;
  persona: Persona;
}
interface SkillDrillContext {
    goalType: GoalType;
}

const App: React.FC = () => {
  const { user, login, logout } = useUser();
  const { isApiKeySet } = useSettings();
  const { showToast } = useToast();
  const { 
    sessions, 
    selectedSession, 
    isLoading: isLoadingSessions, 
    addSession,
    deleteSession, 
    selectSession, 
    toggleFavorite,
    renameSession,
    addPracticeAttempt,
    addQAInteractions,
    updatePulpitContent,
  } = useSession();
  const { registerSkillDrillCompletion } = useGamification();

  const [appState, setAppState] = useState<AppState>('dashboard');
  const [unauthenticatedView, setUnauthenticatedView] = useState<UnauthenticatedView>('landing');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [practiceContext, setPracticeContext] = useState<PracticeContext | null>(null);
  const [scriptedPracticeContext, setScriptedPracticeContext] = useState<ScriptedPracticeContext | null>(null);
  const [qaContext, setQaContext] = useState<QAContext | null>(null);
  const [skillDrillContext, setSkillDrillContext] = useState<SkillDrillContext | null>(null);
  const [freestyleAnalysisMode, setFreestyleAnalysisMode] = useState<AnalysisMode>('standard');
  const [sharedSession, setSharedSession] = useState<Session | null>(null);
  const [pulpitModeSession, setPulpitModeSession] = useState<Session | null>(null);
  const [preGeneratedDrills, setPreGeneratedDrills] = useState<PreGeneratedDrills>({});
  const [nextStepSuggestion, setNextStepSuggestion] = useState<NextStepSuggestion | null>(null);
  const [lastSuggestedSessionId, setLastSuggestedSessionId] = useState<string | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats>({ totalMinutes: 0, estimatedCost: 0 });
  const [weeklySummary, setWeeklySummary] = useState({ isOpen: false, content: '' });
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  
  // Novo estado para armazenar o tópico da sessão atual
  const [currentSessionTopic, setCurrentSessionTopic] = useState<string>('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [appState, unauthenticatedView]);

  const handleGuestLogin = (name: string) => {
      login(name);
      setAppState('dashboard');
  };

  const handleLogout = async () => {
      if (window.confirm("Isso irá desconectar sua conta deste navegador. Seus dados permanecerão salvos no IndexedDB, mas recomendamos fazer um backup antes de limpar o cache do navegador. Deseja sair?")) {
          logout();
          setAppState('dashboard');
          setUnauthenticatedView('landing');
      }
  };
  
  const saveNewSession = async (newSession: Session) => {
    const saved = await addSession(newSession);
    selectSession(saved);
    setAppState('viewing_report');
    setScriptedPracticeContext(null);
    setCurrentSessionTopic(''); // Reset topic
  };

  const handlePracticeComplete = async (attempt: PracticeAttempt, originalSessionId: string) => {
    const updatedSession = await addPracticeAttempt(attempt, originalSessionId);
    selectSession(updatedSession);
    setAppState('viewing_report');
    setPracticeContext(null);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const sessionToDelete = sessions.find(s => s.id === sessionId);
    if (!sessionToDelete) return;
    const sessionTitle = sessionToDelete.title || `Sessão de ${new Date(sessionToDelete.data).toLocaleDateString()}`;
    if (!window.confirm(`Tem certeza de que deseja excluir a sessão "${sessionTitle}"?`)) return;

    await deleteSession(sessionId);
    if (selectedSession && selectedSession.id === sessionId) setAppState('dashboard');
  };
  
  const handleStartPractice = (topic: string, script: string | null, mode: AnalysisMode) => {
      setCurrentSessionTopic(topic); // Armazena o tópico digitado pelo usuário
      if (script) {
          setScriptedPracticeContext({ script });
          setAppState('recording_scripted');
      } else {
          setFreestyleAnalysisMode(mode);
          setAppState('recording_freestyle');
      }
      selectSession(null);
      setPracticeContext(null);
  };

  const handleSelectSession = (session: Session) => { selectSession(session); setAppState('viewing_report'); };
  
  const handleStartNewSession = () => {
      if (!isApiKeySet) {
          showToast("Por favor, adicione sua API Key do Gemini nas Configurações.", 'error');
          handleNavigate('viewing_settings');
          return;
      }
      selectSession(null);
      setPracticeContext(null);
      setScriptedPracticeContext(null);
      setQaContext(null);
      setSkillDrillContext(null);
      setNextStepSuggestion(null);
      setCurrentSessionTopic(''); // Reset topic on new session start
      setAppState('new_session_setup');
  };

  const handleGoToDashboard = () => { if(appState === 'viewing_shared_report') { window.location.hash = ''; window.location.reload(); } else { setAppState('dashboard'); } setNextStepSuggestion(null); setIsMenuOpen(false); };
  const handleNavigate = (state: AppState) => { if (state !== 'viewing_report') { setNextStepSuggestion(null); } setAppState(state); setIsMenuOpen(false); };
  
  const handleStartRePractice = (session: Session, scriptToPractice: string) => {
      const lastAttempt = session.practiceAttempts && session.practiceAttempts.length > 0 ? session.practiceAttempts[session.practiceAttempts.length - 1] : null;
      const previousTranscript = lastAttempt ? lastAttempt.transcricao : session.transcricao;
      
      setPracticeContext({ session, previousTranscript });
      setScriptedPracticeContext({ script: scriptToPractice });
      setCurrentSessionTopic(`Prática: ${session.title}`); // Mantém o contexto do título

      selectSession(null);
      setAppState('recording_scripted');
  };

  const handleCancelPractice = () => { if (practiceContext) { selectSession(sessions.find(s => s.id === practiceContext.session.id) || null); setAppState('viewing_report'); setPracticeContext(null); } else if (appState === 'skill_drill') { setAppState('viewing_journey'); setSkillDrillContext(null); } else { setAppState('dashboard'); } };

  const handleStartQASimulation = (persona: Persona) => { if (!selectedSession) return; setQaContext({ session: selectedSession, persona }); setAppState('in_qa_simulation'); };
  
  const handleQAComplete = async (interactions: QAInteraction[]) => { 
      if (!qaContext) return; 
      const updatedSession = await addQAInteractions(interactions, qaContext.session.id, qaContext.persona); 
      selectSession(updatedSession); 
      setQaContext(null); 
      setAppState('viewing_report'); 
        try {
            const suggestion = await generateSuggestionFromQA(interactions, updatedSession.analysisMode || 'standard');
            if (suggestion) {
                setNextStepSuggestion(suggestion);
            }
        } catch (error) {
            console.error("Failed to generate suggestion from Q&A", error);
        }
    };
  const handleCancelQA = () => { setQaContext(null); setAppState('viewing_report'); };
  const handleStartSkillDrill = (goalType: GoalType) => { setSkillDrillContext({ goalType }); setAppState('skill_drill'); };
  const handleOpenPulpitMode = (session: Session) => setPulpitModeSession(session);
  const handleClosePulpitMode = () => setPulpitModeSession(null);
  const handleSavePulpitContent = async (newContent: string) => { if (!pulpitModeSession) return; 
      const updatedSession = await updatePulpitContent(newContent, pulpitModeSession.id);
      setPulpitModeSession(updatedSession); 
  };
  
  const handleChatNavigation = (targetPage: 'dashboard' | 'new_session' | 'history' | 'journey' | 'settings' | 'tutorial') => {
    switch (targetPage) {
        case 'new_session': handleStartNewSession(); break;
        case 'history': handleNavigate('viewing_history'); break;
        case 'journey': handleNavigate('viewing_journey'); break;
        case 'settings': handleNavigate('viewing_settings'); break;
        case 'tutorial': handleNavigate('viewing_tutorial'); break;
        case 'dashboard': default: handleGoToDashboard(); break;
    }
    setIsMenuOpen(false);
  };

    const handlePredictiveDrillGeneration = useCallback(async (goalType: GoalType) => {
        if (preGeneratedDrills[goalType] || !isApiKeySet) return;
        try {
            const drills = await generateSkillDrillExercise(goalType);
            setPreGeneratedDrills(prev => ({ ...prev, [goalType]: drills }));
        } catch (error) {
            console.error(`Failed to pre-generate drills for ${goalType}:`, error);
        }
    }, [preGeneratedDrills, isApiKeySet]);

    const handleDrillConsumed = useCallback((goalType: GoalType) => {
        setPreGeneratedDrills(prev => {
            const newDrills = { ...prev };
            delete newDrills[goalType];
            return newDrills;
        });
    }, []);

    const handleGenerateNextStepSuggestion = useCallback(async (session: Session) => {
        if (!session || session.id === lastSuggestedSessionId || !isApiKeySet) return;
        setNextStepSuggestion(null);
        try {
            const suggestion = await generateNextStepSuggestion(session);
            setNextStepSuggestion(suggestion);
            setLastSuggestedSessionId(session.id);
        } catch (error) {
            console.error("Failed to generate next step suggestion:", error);
        }
    }, [lastSuggestedSessionId, isApiKeySet]);
    
    const handleGenerateWeeklySummary = async () => {
        setIsGeneratingSummary(true);
        try {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentSessions = sessions.filter(s => new Date(s.data) >= oneWeekAgo);

            if (recentSessions.length < 2) {
                showToast("Você precisa de pelo menos 2 sessões na última semana para gerar um resumo.", 'info');
                return;
            }
            const summary = await generateWeeklySummary(recentSessions);
            setWeeklySummary({ isOpen: true, content: summary });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.';
            showToast(`Erro ao gerar resumo: ${errorMessage}`, 'error');
        } finally {
            setIsGeneratingSummary(false);
        }
    };


  const renderMainAppContent = () => {
    switch (appState) {
      case 'dashboard': return <Dashboard isFirstSession={sessions.length === 1} firstSession={sessions[0]} recentSessions={sessions.slice(0, 3)} onStartNewSession={handleStartNewSession} onSelectSession={handleSelectSession} onToggleFavorite={toggleFavorite} onDeleteSession={handleDeleteSession} onStartSkillDrill={handleStartSkillDrill} sessions={sessions} isGeneratingSummary={isGeneratingSummary} onGenerateWeeklySummary={handleGenerateWeeklySummary} onNavigateToSettings={() => handleNavigate('viewing_settings')} />;
      case 'new_session_setup': return <NewSessionSetup onStartPractice={handleStartPractice} onBack={() => setAppState('dashboard')} />;
      case 'recording_scripted': case 'recording_freestyle': return <Recorder onAnalysisComplete={saveNewSession} onPracticeComplete={handlePracticeComplete} practiceContext={practiceContext} scriptedPracticeContext={scriptedPracticeContext} onCancelPractice={handleCancelPractice} analysisMode={practiceContext?.session.analysisMode || freestyleAnalysisMode} allSessions={sessions} sessionTopic={currentSessionTopic} />;
      case 'viewing_report': if (selectedSession) { return <AnalysisReportComponent session={selectedSession} onPractice={handleStartRePractice} onRenameSession={renameSession} onStartQASimulation={handleStartQASimulation} onOpenPulpitMode={handleOpenPulpitMode} onStartSkillDrill={handleStartSkillDrill} onPredictiveDrillGeneration={handlePredictiveDrillGeneration} nextStepSuggestion={nextStepSuggestion} onGenerateNextStepSuggestion={handleGenerateNextStepSuggestion} />; } setAppState('dashboard'); return null;
      case 'viewing_history': return <HistoryList sessions={sessions} onSelectSession={handleSelectSession} onToggleFavorite={toggleFavorite} onDeleteSession={handleDeleteSession} />;
      case 'viewing_journey': return <JourneyDashboard sessions={sessions} onStartSkillDrill={handleStartSkillDrill} />;
      case 'in_qa_simulation': if (qaContext) return <QASimulation context={qaContext} onComplete={handleQAComplete} onCancel={handleCancelQA} />; setAppState('viewing_report'); return null;
      case 'skill_drill':
        if (skillDrillContext && user) {
            const drills = preGeneratedDrills[skillDrillContext.goalType];
            return <SkillDrill 
                goalType={skillDrillContext.goalType} 
                onComplete={async () => { 
                    await registerSkillDrillCompletion(skillDrillContext.goalType);
                    setAppState('viewing_journey'); 
                    setSkillDrillContext(null); 
                }} 
                onCancel={handleCancelPractice} 
                preGeneratedDrill={drills} 
                onDrillConsumed={handleDrillConsumed} 
            />;
        }
        setAppState('viewing_journey');
        return null;
      case 'viewing_shared_report': if (sharedSession) return <SharedReportViewer session={sharedSession} />; setAppState('dashboard'); return null;
      case 'viewing_tutorial': return <TutorialPage />;
      case 'viewing_settings': return <SettingsPage usageStats={usageStats} />;
      default: return <Dashboard isFirstSession={sessions.length === 1} firstSession={sessions[0]} recentSessions={sessions.slice(0, 3)} onStartNewSession={handleStartNewSession} onSelectSession={handleSelectSession} onToggleFavorite={toggleFavorite} onDeleteSession={handleDeleteSession} onStartSkillDrill={handleStartSkillDrill} sessions={sessions} isGeneratingSummary={isGeneratingSummary} onGenerateWeeklySummary={handleGenerateWeeklySummary} onNavigateToSettings={() => handleNavigate('viewing_settings')} />;
    }
  }
  
  const renderMainApp = () => {
    // Only show loading if sessions are loading AND we think we might be logged in (but UserContext handles user loading)
    if (isLoadingSessions && user) {
        return <div className="flex justify-center items-center h-screen bg-background"><LogoIcon className="w-12 h-12 animate-pulse" /></div>;
    }
    
    if (!user) {
        const handleAuthNavigate = (view: 'login' | 'landing') => {
            setUnauthenticatedView(view);
        };
        switch (unauthenticatedView) {
            case 'login':
                return <LoginPage onNavigate={handleAuthNavigate} onGuestLogin={handleGuestLogin} />;
            case 'privacy':
                return <LegalLayout onBack={() => setUnauthenticatedView('landing')}><PrivacyPolicyPage /></LegalLayout>;
            case 'terms':
                return <LegalLayout onBack={() => setUnauthenticatedView('landing')}><TermsOfUsePage /></LegalLayout>;
            case 'landing':
            default:
                return <LandingPage onStartAuth={() => setUnauthenticatedView('login')} onNavigateToLegal={setUnauthenticatedView} />;
        }
    }

    if (appState === 'viewing_shared_report') {
      return <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">{renderMainAppContent()}</div>;
    }
    
    const MobileNavButton: React.FC<{onClick: () => void, current: boolean, children: React.ReactNode}> = ({onClick, current, children}) => (
        <button
          onClick={onClick}
          className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium ${current ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-slate-700 hover:text-text-primary'}`}
        >{children}</button>
    );

    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Modal isOpen={weeklySummary.isOpen} onClose={() => setWeeklySummary({ isOpen: false, content: '' })} title="Sumário Executivo da Semana">
            <div className="p-4 max-h-[60vh] overflow-y-auto">
                <MarkdownViewer markdown={weeklySummary.content} />
            </div>
        </Modal>
        {pulpitModeSession && <PulpitMode isOpen={!!pulpitModeSession} onClose={handleClosePulpitMode} title={pulpitModeSession.title || 'Estúdio de Ensaio'} content={pulpitModeSession.relatorio.textoOtimizado || ''} onSave={handleSavePulpitContent} /> }
        <header className="p-4 border-b border-card-border/50 sticky top-0 bg-background/80 backdrop-blur-sm z-20">
          <div className="container mx-auto flex justify-between items-center">
            <button onClick={handleGoToDashboard} className="flex items-center gap-3 cursor-pointer">
              <LogoIcon />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">vOx Oratória</h1>
            </button>
              <nav className="hidden md:flex items-center gap-2">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleGoToDashboard(); }} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${appState === 'dashboard' ? 'bg-primary text-white' : 'bg-slate-700/50 hover:bg-slate-700'}`}><DashboardIcon /> <span className="hidden md:inline">Painel</span></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('viewing_tutorial'); }} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${appState === 'viewing_tutorial' ? 'bg-primary text-white' : 'bg-slate-700/50 hover:bg-slate-700'}`}><BookOpenIcon /> <span className="hidden md:inline">Tutorial</span></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('viewing_journey'); }} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${appState === 'viewing_journey' ? 'bg-primary text-white' : 'bg-slate-700/50 hover:bg-slate-700'}`}><JourneyIcon /> <span className="hidden md:inline">Jornada</span></a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('viewing_history'); }} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${appState === 'viewing_history' ? 'bg-primary text-white' : 'bg-slate-700/50 hover:bg-slate-700'}`}><HistoryIcon /> <span className="hidden md:inline">Histórico</span></a>
                  <div className="ml-4 pl-4 border-l border-slate-600 flex items-center gap-2">
                        <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('viewing_settings'); }} className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors duration-200 ${appState === 'viewing_settings' ? 'bg-primary text-white' : 'bg-slate-700/50 hover:bg-slate-700'}`} title="Configurações"><SettingsIcon /> <span className="hidden lg:inline">Configurações</span></a>
                        <button onClick={handleLogout} className="flex items-center gap-2 pr-2 pl-4 py-2 rounded-full bg-slate-700/50 hover:bg-red-500/50 transition-colors duration-200" title="Sair">
                            <span className="hidden md:inline text-sm">{user?.name}</span>
                            {user?.profilePictureUrl ? (
                                <img src={user.profilePictureUrl} alt="Foto de perfil" className="w-8 h-8 rounded-full" />
                            ) : (
                                <LogoutIcon className="w-5 h-5" />
                            )}
                        </button>
                  </div>
                </nav>
                <div className="md:hidden">
                  <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-text-secondary hover:text-white hover:bg-slate-700"><span className="sr-only">Abrir menu</span>{isMenuOpen ? <CloseIcon className="w-6 h-6"/> : <MenuIcon className="w-6 h-6"/>}</button>
                </div>
          </div>
          {isMenuOpen && (
            <div className="md:hidden"><div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                <MobileNavButton onClick={handleGoToDashboard} current={appState === 'dashboard'}><DashboardIcon /> Painel</MobileNavButton>
                <MobileNavButton onClick={() => handleNavigate('viewing_tutorial')} current={appState === 'viewing_tutorial'}><BookOpenIcon /> Tutorial</MobileNavButton>
                <MobileNavButton onClick={() => handleNavigate('viewing_journey')} current={appState === 'viewing_journey'}><JourneyIcon /> Jornada</MobileNavButton>
                <MobileNavButton onClick={() => handleNavigate('viewing_history')} current={appState === 'viewing_history'}><HistoryIcon /> Histórico</MobileNavButton>
                <div className="pt-2 mt-2 border-t border-slate-700 space-y-2">
                    <MobileNavButton onClick={() => handleNavigate('viewing_settings')} current={appState === 'viewing_settings'}><SettingsIcon /> Configurações</MobileNavButton>
                    <MobileNavButton onClick={handleLogout} current={false}>
                        {user?.profilePictureUrl ? (
                            <img src={user.profilePictureUrl} alt="Foto de perfil" className="w-6 h-6 rounded-full" />
                        ) : (
                            <LogoutIcon />
                        )}
                        Sair ({user?.name})
                    </MobileNavButton>
                </div>
              </div></div>
          )}
        </header>
        <main className="flex-grow container mx-auto px-4 py-8 md:px-8 md:py-12 flex flex-col items-center justify-start">
          {renderMainAppContent()}
        </main>
        {user && <ChatWidget onNavigate={handleChatNavigation} />}
      </div>
    );
  }

  return renderMainApp();
};

export default App;