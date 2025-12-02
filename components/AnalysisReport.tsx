import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Session, Persona, GoalType, NextStepSuggestion, PracticeAttempt, FillerWord, SentenceSentiment, EngagementHighlight, StructureSectionReport, EvolucaoReport, QAInteraction, QASession } from '../types';
import { ClarityIcon, FillerWordsIcon, RhythmIcon, StrengthIcon, TranscriptIcon, OptimizedTextIcon, EvolutionIcon, EditIcon, WpmIcon, PitchIcon, PausesIcon, QAIcon, PlaybackIcon, Projector, LoadingIcon, CheckSquare, QAIconStandalone, HistoryIcon, Sparkles, StructureIcon, VocabularyIcon, SentimentIcon, BenchmarkIcon, JargonIcon, CheckCircle2, Target, VocalToneIcon, InvestorIcon, ClientIcon, JournalistIcon, UserIcon } from './icons';
import { personas } from '../personas';
import { PersonaSelectionModal } from './PersonaSelectionModal';
import { WaveformPlayer } from './WaveformPlayer';
import NextStepSuggestionCard from './NextStepSuggestionCard';
import Modal from './common/Modal'; // Importando Modal
import { Button } from './ui/button'; // Importando Button para a UI do modal

type ActiveTab = 'summary' | 'details' | 'transcript' | 'qa';

const ClarityGauge: React.FC<{ score: number; size?: 'small' | 'large' }> = ({ score, size = 'large' }) => {
    const isSmall = size === 'small';
    const radius = isSmall ? 28 : 56;
    const strokeWidth = isSmall ? 6 : 8;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.max(0, Math.min(10, score)) / 10;
    const offset = circumference - progress * circumference;

    const getColor = (s: number) => {
        if (s >= 8) return 'text-green-400';
        if (s >= 5) return 'text-amber-400';
        return 'text-red-400';
    };

    return (
        <div className={`relative ${isSmall ? 'w-16 h-16' : 'w-36 h-36'} mx-auto flex items-center justify-center`}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120">
                <circle className="text-slate-700" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius-4} cx="60" cy="60" />
                <circle
                    className={getColor(score)}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius-4}
                    cx="60"
                    cy="60"
                    transform="rotate(-90 60 60)"
                />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className={`font-bold text-white ${isSmall ? 'text-xl' : 'text-4xl'}`}>{score}</span>
                {!isSmall && <span className="text-sm text-text-secondary">/10</span>}
            </div>
        </div>
    );
};

const FillerWordsChart: React.FC<{ words: FillerWord[] }> = ({ words }) => {
    if (!words || words.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
                 <CheckSquare className="w-10 h-10 text-green-400 mb-2"/>
                <p className="text-text-secondary font-semibold">Nenhum vício de linguagem detectado!</p>
                <p className="text-sm text-slate-500">Ótimo trabalho.</p>
            </div>
        )
    }

    const maxCount = Math.max(...words.map(w => w.contagem), 1);

    return (
        <div className="space-y-3 h-full flex flex-col justify-end pt-4">
            {words.map(word => (
                <div key={word.palavra} className="flex items-center gap-2 group">
                    <span className="text-sm font-semibold capitalize w-16 text-right truncate" title={word.palavra}>{word.palavra}</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-6 relative">
                        <div 
                            className="bg-primary h-6 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                            style={{ width: `${(word.contagem / maxCount) * 100}%` }}
                        >
                             <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">{word.contagem}x</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const MetricIndicator: React.FC<{
    value: number;
    label: string;
    min: number;
    max: number;
    idealMin?: number;
    idealMax?: number;
}> = ({ value, label, min, max, idealMin, idealMax }) => {
    const range = max - min;
    const valuePosition = Math.max(0, Math.min(100, ((value - min) / range) * 100));
    
    const getBarColor = (val: number) => {
        if (idealMin !== undefined && idealMax !== undefined) {
            if (val >= idealMin && val <= idealMax) return 'bg-green-500';
            if (val < min + range * 0.25 || val > max - range * 0.25) return 'bg-red-500';
            return 'bg-amber-500';
        }
        return 'bg-primary';
    };

    return (
        <div className="w-full flex flex-col">
            <div className="flex justify-between w-full text-sm text-text-secondary mb-2">
                <span><span className="font-bold text-white">{value.toFixed(label === 'PPM' ? 0 : 1)}</span> {label}</span>
                {idealMin && <span>Ideal: <span className="font-bold text-white">{idealMin}-{idealMax}</span></span>}
            </div>
            <div className="relative w-full h-2 bg-slate-700 rounded-full">
                 <div 
                    className={`absolute h-full rounded-full ${getBarColor(value)}`}
                    style={{ width: `${valuePosition}%`, transition: 'width 0.5s ease-out' }}
                />
            </div>
        </div>
    );
};

const getEventClassName = (eventType: string) => {
    switch (eventType) {
        case 'FILLER_WORD': return 'bg-red-500/20 border-b-2 border-red-500/50 cursor-pointer';
        case 'UNCLEAR_PHRASE': return 'bg-amber-500/20 border-b-2 border-amber-500/50 cursor-pointer';
        case 'MONOTONE_DELIVERY': return 'bg-blue-500/20 border-b-2 border-blue-500/50 cursor-pointer';
        case 'STRONG_PHRASE': return 'bg-green-500/20 border-b-2 border-green-500/50 cursor-pointer';
        default: return 'bg-purple-500/20 border-b-2 border-purple-500/50 cursor-pointer';
    }
};

interface InteractiveTranscriptProps {
    transcript: string;
    events: any[];
    onToggleTooltip: (content: string, rect: DOMRect) => void;
}

type TooltipState = {
    content: string;
    top: number;
    left: number;
    transform: string;
} | null;

const InteractiveTranscript: React.FC<InteractiveTranscriptProps> = ({ transcript, events, onToggleTooltip }) => {
    const segments = useMemo(() => {
        if (!events || events.length === 0) return [{ type: 'text' as const, content: transcript }];
        const sortedEvents = [...(events || [])];
        sortedEvents.sort((a, b) => transcript.indexOf(a.text) - transcript.indexOf(b.text));
        const result: { type: 'text' | 'event'; content: string; event?: any }[] = [];
        let lastIndex = 0;
        sortedEvents.forEach(event => {
            if (!event.text) return;
            const index = transcript.indexOf(event.text, lastIndex);
            if (index === -1) return;
            if (index > lastIndex) {
                result.push({ type: 'text', content: transcript.substring(lastIndex, index) });
            }
            result.push({ type: 'event', content: event.text, event: event });
            lastIndex = index + event.text.length;
        });
        if (lastIndex < transcript.length) {
            result.push({ type: 'text', content: transcript.substring(lastIndex) });
        }
        return result.length > 0 ? result : [{ type: 'text', content: transcript }];
    }, [transcript, events]);

    return (
        <p className="text-lg leading-relaxed">
            {segments.map((segment, index) =>
                segment.type === 'event' ? (
                    <span
                        key={index}
                        className={getEventClassName(segment.event.eventType)}
                        onClick={(e) => onToggleTooltip(segment.event.suggestion, e.currentTarget.getBoundingClientRect())}
                        tabIndex={0}
                        role="button"
                    >
                        {segment.content}
                    </span>
                ) : (
                    <span key={index}>{segment.content}</span>
                )
            )}
        </p>
    );
};

interface AnalysisReportProps {
  session: Session;
  onPractice: (session: Session, script: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onStartQASimulation: (persona: Persona) => void;
  onOpenPulpitMode: (session: Session) => void;
  onStartSkillDrill: (goalType: GoalType) => void;
  onPredictiveDrillGeneration: (goalType: GoalType) => void;
  nextStepSuggestion: NextStepSuggestion | null;
  onGenerateNextStepSuggestion: (session: Session) => void;
}

const Card: React.FC<{ children: React.ReactNode; className?: string; onMouseEnter?: () => void; onMouseLeave?: () => void; }> = ({ children, className = '', ...props }) => (
  <div className={`bg-card border border-card-border rounded-xl p-4 md:p-6 shadow-card flex flex-col ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader: React.FC<{ icon: React.ReactNode; title: React.ReactNode }> = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="text-primary">{icon}</div>
    <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
  </div>
);

const TabButton: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:bg-slate-700'}`}
    >
        {label}
    </button>
);

const MetricCard: React.FC<{ title: string; value: string; unit: string; description: string }> = ({ title, value, unit, description }) => (
    <div className="bg-background/50 p-4 rounded-lg text-center flex-1">
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="text-3xl font-bold text-primary my-1">
            {value} <span className="text-lg font-normal text-text-secondary">{unit}</span>
        </p>
        <p className="text-xs text-slate-400">{description}</p>
    </div>
);

const AnalysisScorecard: React.FC<{ report: Session['relatorio'] }> = ({ report }) => {
    const fillerWordsCount = (report.palavrasPreenchimento || []).reduce((acc, curr) => acc + curr.contagem, 0);
    return (
        <Card className="lg:col-span-2">
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="flex-shrink-0 text-center">
                    <h4 className="font-semibold mb-2 text-text-primary">Nota de Clareza</h4>
                    <ClarityGauge score={report.clareza?.nota || 0} />
                </div>
                <div className="w-full flex-grow space-y-4">
                    <p className="text-center md:text-left text-text-secondary italic">"{report.clareza?.justificativa || 'Análise de clareza indisponível.'}"</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <MetricCard title="Vícios de Linguagem" value={String(fillerWordsCount)} unit="total" description="Quanto menos, melhor" />
                        <MetricCard title="Velocidade" value={String(report.wpm?.valor.toFixed(0) || 0)} unit="PPM" description="Ideal: 140-160" />
                        <MetricCard title="Estrutura" value={String(report.estrutura?.desenvolvimento.nota || 0)} unit="/ 10" description="Coesão do Discurso" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

const StructureSectionDisplay: React.FC<{ title: string; section: StructureSectionReport }> = ({ title, section }) => (
    <div className="flex flex-col sm:flex-row items-start gap-4 p-2">
        <div className="flex-shrink-0 text-center w-full sm:w-24">
            <p className="font-semibold text-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-primary">{section.nota}<span className="text-base text-text-secondary">/10</span></p>
        </div>
        <p className="text-text-secondary border-t-2 sm:border-t-0 sm:border-l-2 border-slate-700 pt-2 sm:pt-0 sm:pl-4 flex-grow">{section.analise}</p>
    </div>
);

const TrendIndicator: React.FC<{ trend: EvolucaoReport['tendenciaClareza'] | EvolucaoReport['tendenciaWPM'] }> = ({ trend }) => {
    const config = {
        melhorando: { text: "Melhorando", color: "text-green-400" },
        acelerando: { text: "Acelerando", color: "text-green-400" },
        estagnado: { text: "Estagnado", color: "text-amber-400" },
        estabilizando: { text: "Estabilizando", color: "text-green-400" },
        piorando: { text: "Piorando", color: "text-red-400" },
        desacelerando: { text: "Desacelerando", color: "text-amber-400" },
        insuficiente: { text: "Dados Insuficientes", color: "text-slate-500" },
    };
    const { text, color } = config[trend] || config.insuficiente;
    return <span className={`font-bold ${color}`}>{text}</span>;
};

const EvolutionCard: React.FC<{ evolucao: EvolucaoReport }> = ({ evolucao }) => (
    <Card>
        <CardHeader icon={<EvolutionIcon className="w-6 h-6" />} title="Sua Evolução" />
        <div className="space-y-4">
            <p className="text-text-secondary italic">"{evolucao.comentarioGeral}"</p>
            <div className="flex flex-col sm:flex-row justify-around gap-4 pt-4 border-t border-slate-700">
                <div className="text-center">
                    <p className="text-sm font-semibold text-text-secondary">Tendência de Clareza</p>
                    <TrendIndicator trend={evolucao.tendenciaClareza} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-text-secondary">Tendência de Ritmo (PPM)</p>
                    <TrendIndicator trend={evolucao.tendenciaWPM} />
                </div>
            </div>
        </div>
    </Card>
);

const QASessionView: React.FC<{ qaSession: QASession }> = ({ qaSession }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getPersonaIcon = (id: string) => {
        const className = "w-6 h-6 text-primary";
        switch (id) {
            case 'investor': return <InvestorIcon className={className} />;
            case 'client': return <ClientIcon className={className} />;
            case 'journalist': return <JournalistIcon className={className} />;
            default: return <UserIcon className={className} />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="border border-slate-700 rounded-lg overflow-hidden mb-4">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-background/50 hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {getPersonaIcon(qaSession.persona.id)}
                    <div className="text-left">
                        <p className="font-semibold text-text-primary">{qaSession.persona.name}</p>
                        <p className="text-xs text-text-secondary">{formatDate(qaSession.timestamp)}</p>
                    </div>
                </div>
                <div className="text-text-secondary">
                    {isExpanded ? "▲" : "▼"}
                </div>
            </button>
            
            {isExpanded && (
                <div className="p-4 bg-slate-800/20 border-t border-slate-700 space-y-4">
                    {qaSession.interactions.map((interaction, idx) => (
                        <div key={idx} className="p-3 bg-background/50 rounded-lg border border-slate-700/50">
                            <div className="mb-2">
                                <span className="text-xs font-bold text-primary uppercase">Pergunta:</span>
                                <p className="font-semibold text-text-primary mt-1">{interaction.question}</p>
                            </div>
                            <div className="pl-3 border-l-2 border-slate-600 mb-3">
                                <span className="text-xs font-bold text-text-secondary uppercase">Sua Resposta:</span>
                                <p className="text-sm text-text-primary mt-1 italic">"{interaction.userAnswer}"</p>
                            </div>
                            <div className="flex items-start gap-2 bg-indigo-500/10 p-2 rounded text-xs text-indigo-200">
                                <span className="font-bold shrink-0">Feedback:</span>
                                <p>{interaction.feedback}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AnalysisReportComponent: React.FC<AnalysisReportProps> = ({ 
    session, onPractice, onRenameSession, onStartQASimulation, onOpenPulpitMode,
    onStartSkillDrill, nextStepSuggestion, onGenerateNextStepSuggestion
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(session.title || '');
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | 'original'>(
    session.practiceAttempts && session.practiceAttempts.length > 0 ? session.practiceAttempts.length - 1 : 'original'
  );
  
  // State for Pulpit Mode content selection
  const [showPulpitSelection, setShowPulpitSelection] = useState(false);

  const { displayedReport, displayedTranscript, displayedDuration, displayedAudioBlob } = useMemo(() => {
    if (viewingIndex === 'original' || !session.practiceAttempts || session.practiceAttempts.length === 0) {
      return { 
          displayedReport: session.relatorio, 
          displayedTranscript: session.transcricao, 
          displayedDuration: session.duracao,
          displayedAudioBlob: session.audio_blob
      };
    }
    const attempt = session.practiceAttempts[viewingIndex];
    return { 
        displayedReport: attempt.relatorio, 
        displayedTranscript: attempt.transcricao,
        displayedDuration: attempt.duracao,
        displayedAudioBlob: attempt.audio_blob
    };
  }, [session, viewingIndex]);

  useEffect(() => {
    if (displayedAudioBlob) {
      const url = URL.createObjectURL(displayedAudioBlob);
      setAudioUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
        setAudioUrl(null);
    }
  }, [displayedAudioBlob]);

  const sessionForActions = useMemo(() => {
    if (session.practiceAttempts && session.practiceAttempts.length > 0) {
      const latestAttempt = session.practiceAttempts[session.practiceAttempts.length - 1];
      return { ...session, relatorio: latestAttempt.relatorio, transcricao: latestAttempt.transcricao };
    }
    return session;
  }, [session]);
  
  const strengths = useMemo(() => {
    const points: string[] = [];
    if (!displayedReport) return points;

    if (displayedReport.clareza?.nota >= 8) {
        points.push("Excelente clareza na comunicação, facilitando a compreensão da mensagem.");
    }

    const fillerWordsCount = (displayedReport.palavrasPreenchimento || []).reduce((acc, curr) => acc + curr.contagem, 0);
    // FIX: 'transcricao' exists on the Session/PracticeAttempt, not the report. Use 'displayedTranscript' instead.
    if (fillerWordsCount === 0 && displayedTranscript.trim().split(/\s+/).length > 10) {
        points.push("Discurso limpo e direto, sem o uso de vícios de linguagem.");
    }

    if (displayedReport.estrutura?.abertura.nota >= 8) {
        points.push("A abertura do discurso foi forte e capturou a atenção inicial.");
    }
    if (displayedReport.estrutura?.desenvolvimento.nota >= 8) {
        points.push("O desenvolvimento do tema foi bem estruturado e coeso.");
    }
    if (displayedReport.estrutura?.conclusao.nota >= 8) {
        points.push("A conclusão foi eficaz e resumiu bem os pontos principais.");
    }
    
    if (displayedReport.forca?.frases_impactantes && displayedReport.forca.frases_impactantes.length > 0) {
      points.push(...displayedReport.forca.frases_impactantes.map(s => `Uso de frase de impacto: "${s}"`));
    }
    
    if (points.length === 0) {
        return ["A IA não destacou pontos fortes específicos nesta análise. Continue praticando!"];
    }

    return [...new Set(points)].slice(0, 3);
  }, [displayedReport, displayedTranscript]);

  const weaknesses = useMemo(() => {
    const points: string[] = [];
    if (!displayedReport) return points;

    if (displayedReport.clareza?.nota < 5) {
        points.push(`A clareza geral da mensagem pode ser melhorada. (${displayedReport.clareza.justificativa})`);
    }

    const fillerWordsCount = (displayedReport.palavrasPreenchimento || []).reduce((acc, curr) => acc + curr.contagem, 0);
    if (fillerWordsCount > 5) {
        points.push(`Reduzir o uso de vícios de linguagem (${fillerWordsCount} detectados) para aumentar a confiança.`);
    }

    if (displayedReport.ritmo?.analise) {
        points.push(displayedReport.ritmo.analise);
    }
    if (displayedReport.entonação?.analise) {
        points.push(displayedReport.entonação.analise);
    }
    if (displayedReport.pausas?.analise) {
        points.push(displayedReport.pausas.analise);
    }

    if (displayedReport.estrutura?.abertura.nota < 5) {
        points.push(`Abertura: ${displayedReport.estrutura.abertura.analise}`);
    }
    if (displayedReport.estrutura?.desenvolvimento.nota < 5) {
        points.push(`Desenvolvimento: ${displayedReport.estrutura.desenvolvimento.analise}`);
    }
    if (displayedReport.estrutura?.conclusao.nota < 5) {
        points.push(`Conclusão: ${displayedReport.estrutura.conclusao.analise}`);
    }
    
    if (points.length === 0 && displayedReport.clareza?.nota < 8) {
        points.push(displayedReport.clareza.justificativa);
    }

    if (points.length === 0) {
        return ["Nenhum ponto de melhoria crítico foi detectado. Ótimo trabalho!"];
    }

    return [...new Set(points)].slice(0, 3);
  }, [displayedReport]);
  
  useEffect(() => {
    onGenerateNextStepSuggestion(sessionForActions);
  }, [sessionForActions, onGenerateNextStepSuggestion]);

  useEffect(() => {
    setTooltip(null);
  }, [audioUrl, activeTab]);
  
  const handleRename = () => {
    if (newTitle.trim() && newTitle.trim() !== (session.title || '')) {
      onRenameSession(session.id, newTitle.trim());
    }
    setIsRenaming(false);
  };

  const handleToggleTooltip = (content: string, targetRect: DOMRect) => {
    setTooltip(currentTooltip => {
        if (currentTooltip && currentTooltip.content === content) return null;
        const PADDING = 10;
        let top = targetRect.top - PADDING;
        let transform = `translate(-50%, -100%)`;
        if (top < PADDING) {
            top = targetRect.bottom + PADDING;
            transform = `translate(-50%, 0)`;
        }
        let left = targetRect.left + targetRect.width / 2;
        return { content, top, left, transform };
    });
  };

  const handleConfirmPulpitMode = (version: 'original' | 'optimized') => {
      setShowPulpitSelection(false);
      const contentToUse = version === 'original' 
        ? sessionForActions.transcricao 
        : sessionForActions.relatorio.textoOtimizado;

      // Criamos um objeto de sessão modificado onde o 'textoOtimizado' é o conteúdo escolhido.
      // O App.tsx espera o conteúdo em relatorio.textoOtimizado para o PulpitMode.
      const modifiedSession = {
          ...sessionForActions,
          relatorio: {
              ...sessionForActions.relatorio,
              textoOtimizado: contentToUse
          }
      };
      onOpenPulpitMode(modifiedSession);
  };

  // Combine legacy interactions and new sessions for display
  const hasQAHistory = (session.qaInteractions && session.qaInteractions.length > 0) || (session.qaSessions && session.qaSessions.length > 0);

  const renderContent = () => {
    switch (activeTab) {
        case 'summary':
            return (
                <div className="space-y-6 animate-fade-in">
                    <AnalysisScorecard report={displayedReport} />
                    {displayedReport.evolucao && <EvolutionCard evolucao={displayedReport.evolucao} />}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                             <CardHeader icon={<CheckCircle2 className="w-6 h-6 text-green-400" />} title="Pontos Fortes" />
                             <ul className="space-y-2 list-disc list-inside text-text-secondary">
                                {strengths.map((s, i) => <li key={i}>{s}</li>)}
                            </ul>
                        </Card>
                         <Card>
                             <CardHeader icon={<Target className="w-6 h-6 text-amber-400" />} title="Pontos a Melhorar" />
                              <ul className="space-y-2 list-disc list-inside text-text-secondary">
                                {weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                              </ul>
                        </Card>
                    </div>
                    {nextStepSuggestion && (
                      <NextStepSuggestionCard 
                        suggestion={nextStepSuggestion} 
                        onStartSkillDrill={onStartSkillDrill} 
                        onStartQASimulation={onStartQASimulation}
                        onOpenPersonaSelection={() => setShowPersonaModal(true)} 
                      />
                    )}
                     <Card>
                        <CardHeader icon={<Sparkles className="w-6 h-6"/>} title="Próximos Passos e Ações" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <button onClick={() => onPractice(session, sessionForActions.relatorio.textoOtimizado)} className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                                <OptimizedTextIcon className="w-8 h-8"/>
                                <div><h4 className="font-semibold">Praticar Versão Otimizada</h4><p className="text-xs text-text-secondary">Treine com o texto da IA.</p></div>
                            </button>
                             <button onClick={() => setShowPulpitSelection(true)} className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                                <Projector className="w-8 h-8"/>
                                <div><h4 className="font-semibold">Abrir Estúdio de Ensaio</h4><p className="text-xs text-text-secondary">Teleprompter e IA em tempo real.</p></div>
                            </button>
                             <button onClick={() => setShowPersonaModal(true)} className="flex items-center gap-3 p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-left">
                                <QAIconStandalone className="w-8 h-8"/>
                                <div><h4 className="font-semibold">Simulação de Q&A</h4><p className="text-xs text-text-secondary">Teste seus argumentos.</p></div>
                            </button>
                        </div>
                    </Card>
                </div>
            );
        case 'details':
            return (
                <div className="space-y-8 animate-fade-in">
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Performance Vocal</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card>
                                <CardHeader icon={<FillerWordsIcon />} title="Vícios de Linguagem" />
                                <FillerWordsChart words={displayedReport.palavrasPreenchimento || []} />
                            </Card>
                            <Card><CardHeader icon={<WpmIcon />} title="Velocidade" /><MetricIndicator value={displayedReport.wpm?.valor || 0} label="PPM" min={80} max={220} idealMin={140} idealMax={160} /><p className="text-text-secondary text-center mt-4 text-sm">{displayedReport.wpm?.analise}</p></Card>
                            <Card><CardHeader icon={<PitchIcon />} title="Entonação" /><MetricIndicator value={displayedReport.entonação?.variacao || 0} label="Score" min={0} max={10} idealMin={3.0} idealMax={5.0} /><p className="text-text-secondary text-center mt-4 text-sm">{displayedReport.entonação?.analise}</p></Card>
                            <Card><CardHeader icon={<PausesIcon />} title="Pausas" /><MetricIndicator value={displayedReport.pausas?.qualidade || 0} label="Qualidade" min={0} max={10} idealMin={6} idealMax={9} /><p className="text-text-secondary text-center mt-4 text-sm">{displayedReport.pausas?.analise}</p></Card>
                        </div>
                    </div>
                     <div>
                        <h3 className="text-2xl font-bold mb-4">Estrutura e Conteúdo</h3>
                        <div className="grid grid-cols-1 gap-6">
                           {displayedReport.estrutura && (
                               <Card>
                                   <CardHeader icon={<StructureIcon />} title="Análise Estrutural" />
                                   <div className="space-y-4">
                                       <StructureSectionDisplay title="Abertura" section={displayedReport.estrutura.abertura} />
                                       <StructureSectionDisplay title="Desenvolvimento" section={displayedReport.estrutura.desenvolvimento} />
                                       <StructureSectionDisplay title="Conclusão" section={displayedReport.estrutura.conclusao} />
                                   </div>
                                   <div className="mt-6 border-t border-slate-700 pt-4">
                                       <h4 className="font-semibold text-text-primary mb-2">Comentário Geral sobre a Estrutura</h4>
                                       <p className="text-text-secondary italic">"{displayedReport.estrutura.comentarioGeral}"</p>
                                   </div>
                               </Card>
                           )}
                           {displayedReport.vocabularioETom && (
                                <Card>
                                    <CardHeader icon={<VocabularyIcon />} title="Vocabulário e Tom" />
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-text-primary mb-2">Análise de Tom</h4>
                                            <p className="text-text-secondary">{displayedReport.vocabularioETom.analiseTom}</p>
                                        </div>
                                        {(displayedReport.vocabularioETom.palavrasRepetidas.length > 0 || displayedReport.vocabularioETom.palavrasMuleta.length > 0) && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {displayedReport.vocabularioETom.palavrasRepetidas.length > 0 && (
                                                    <div>
                                                        <h5 className="font-semibold text-text-primary mb-2">Palavras Repetidas</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {displayedReport.vocabularioETom.palavrasRepetidas.map(p => (
                                                                <span key={p.palavra} className="bg-slate-700 text-sm px-2 py-1 rounded-md">{p.palavra} ({p.contagem}x)</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {displayedReport.vocabularioETom.palavrasMuleta.length > 0 && (
                                                    <div>
                                                        <h5 className="font-semibold text-text-primary mb-2">Frases/Termos de Apoio</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {displayedReport.vocabularioETom.palavrasMuleta.map(p => (
                                                                <span key={p} className="bg-slate-700 text-sm px-2 py-1 rounded-md">{p}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {displayedReport.vocabularioETom.jargonSuggestions && displayedReport.vocabularioETom.jargonSuggestions.length > 0 && (
                                            <div className="border-t border-slate-700 pt-4 mt-4">
                                                <CardHeader icon={<JargonIcon />} title="Sugestões para Simplificar Jargões" />
                                                <ul className="space-y-2">
                                                    {displayedReport.vocabularioETom.jargonSuggestions.map((s, i) => (
                                                        <li key={i} className="text-sm p-2 bg-background rounded-md">
                                                            <span className="font-bold text-amber-400">"{s.term}"</span> &rarr; <span className="text-green-400">"{s.suggestion}"</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                           )}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold mb-4">Análise Comportamental</h3>
                        <div className="grid grid-cols-1 gap-6">
                            {displayedReport.tomDeVoz && (
                                <Card>
                                    <CardHeader icon={<VocalToneIcon />} title="Tom de Voz e Energia" />
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-text-primary mb-2 text-center">Tom Geral Percebido</h4>
                                            <p className="text-center text-lg font-bold text-primary p-2 bg-background/50 rounded-md">"{displayedReport.tomDeVoz.overallTone}"</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-primary mb-2">Nível de Energia</h4>
                                            <MetricIndicator value={displayedReport.tomDeVoz.energyLevel} label="Energia" min={0} max={10} idealMin={6} idealMax={9} />
                                        </div>
                                        <div className="border-t border-slate-700 pt-4">
                                            <h4 className="font-semibold text-text-primary mb-2">Análise Emocional</h4>
                                            <p className="text-text-secondary italic">"{displayedReport.tomDeVoz.emotionAnalysis}"</p>
                                        </div>
                                        <div className="border-t border-slate-700 pt-4">
                                            <h4 className="font-semibold text-text-primary mb-2">Feedback para Melhoria</h4>
                                            <p className="text-text-secondary">{displayedReport.tomDeVoz.feedback}</p>
                                        </div>
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            );
        case 'transcript':
            return (
                <div className="space-y-6 animate-fade-in">
                    <Card>
                        <CardHeader icon={<PlaybackIcon />} title="Replay Interativo" />
                        {audioUrl ? <WaveformPlayer audioUrl={audioUrl} /> : <p className="text-text-secondary">Áudio não disponível para esta visualização.</p>}
                    </Card>
                     <Card>
                        <CardHeader icon={<TranscriptIcon />} title="Transcrição da Fala" />
                        <div className="mt-4 p-4 bg-background/50 rounded-lg max-h-96 overflow-y-auto" onClick={(e) => {if ((e.target as HTMLElement).tagName !== 'SPAN') setTooltip(null)}}>
                            <InteractiveTranscript transcript={displayedTranscript} events={displayedReport.events || []} onToggleTooltip={handleToggleTooltip} />
                        </div>
                    </Card>
                    <Card>
                        <CardHeader icon={<OptimizedTextIcon />} title="Texto Otimizado pela IA" />
                         <p className="text-text-secondary whitespace-pre-wrap p-4">{displayedReport.textoOtimizado}</p>
                    </Card>
                </div>
            );
        case 'qa':
            return (
                <div className="space-y-6 animate-fade-in">
                    <Card>
                        <CardHeader icon={<QAIconStandalone className="w-6 h-6"/>} title="Histórico de Simulações Q&A" />
                        {hasQAHistory ? (
                            <div className="space-y-6">
                                {/* Display structured historical sessions */}
                                {session.qaSessions && session.qaSessions.length > 0 && 
                                    [...session.qaSessions].reverse().map((qaSession) => (
                                        <QASessionView key={qaSession.id} qaSession={qaSession} />
                                    ))
                                }
                                
                                {/* Fallback for legacy data (flat list) if no structured history yet */}
                                {(!session.qaSessions || session.qaSessions.length === 0) && session.qaInteractions && session.qaInteractions.length > 0 && (
                                    <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                        <p className="text-xs font-bold text-text-secondary uppercase mb-4">Simulação Anterior (Legado)</p>
                                        {session.qaInteractions.map((interaction, idx) => (
                                            <div key={idx} className="p-4 bg-background/50 rounded-lg border border-slate-700 mb-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="px-2 py-1 text-xs font-bold bg-primary text-white rounded uppercase">{interaction.persona}</span>
                                                    <p className="font-semibold text-text-primary">{interaction.question}</p>
                                                </div>
                                                <div className="pl-4 border-l-2 border-slate-600 mb-4 ml-1">
                                                    <p className="text-sm text-text-secondary italic mb-1">Sua resposta:</p>
                                                    <p className="text-text-primary">"{interaction.userAnswer}"</p>
                                                </div>
                                                <div className="flex items-start gap-2 bg-indigo-500/10 p-3 rounded border border-indigo-500/20 text-sm text-indigo-200">
                                                    <span className="font-bold shrink-0">Feedback do Coach:</span>
                                                    <p>{interaction.feedback}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-text-secondary">Nenhuma simulação de Q&A foi realizada nesta sessão.</p>
                                <button onClick={() => setShowPersonaModal(true)} className="mt-4 px-6 py-2 bg-primary hover:bg-primary-hover rounded-full text-sm font-semibold transition-colors">Iniciar Simulação</button>
                            </div>
                        )}
                    </Card>
                </div>
            );
    }
  }
  
  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in w-full">
        {tooltip && ReactDOM.createPortal(
            <div role="tooltip" className="fixed z-50 p-3 bg-card border border-card-border rounded-lg shadow-2xl max-w-sm text-sm" style={{ top: tooltip.top, left: tooltip.left, transform: tooltip.transform, transition: 'opacity 0.2s', opacity: 1 }}>{tooltip.content}</div>,
            document.body
        )}
        {showPersonaModal && <PersonaSelectionModal onSelectPersona={(p) => { onStartQASimulation(p); setShowPersonaModal(false); }} onClose={() => setShowPersonaModal(false)} />}
        
        {/* Modal de Seleção de Conteúdo para o Púlpito */}
        {showPulpitSelection && (
            <Modal
                isOpen={showPulpitSelection}
                onClose={() => setShowPulpitSelection(false)}
                title="Escolha a Versão para Ensaio"
                footer={<Button onClick={() => setShowPulpitSelection(false)} variant="ghost">Cancelar</Button>}
            >
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => handleConfirmPulpitMode('original')}
                        className="flex flex-col items-center justify-center p-6 bg-card border-2 border-slate-700 hover:border-primary hover:bg-primary/5 rounded-xl transition-all duration-300 group"
                    >
                        <TranscriptIcon className="w-12 h-12 text-slate-400 group-hover:text-primary mb-4" />
                        <h3 className="text-lg font-bold text-text-primary">Versão Original</h3>
                        <p className="text-sm text-text-secondary text-center mt-2">
                            Praticar exatamente com o texto transcrito da sua fala original.
                        </p>
                    </button>

                    <button 
                        onClick={() => handleConfirmPulpitMode('optimized')}
                        className="flex flex-col items-center justify-center p-6 bg-card border-2 border-indigo-500/50 hover:border-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all duration-300 group"
                    >
                        <OptimizedTextIcon className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 mb-4" />
                        <h3 className="text-lg font-bold text-text-primary">Versão Otimizada (IA)</h3>
                        <p className="text-sm text-text-secondary text-center mt-2">
                            Praticar a versão melhorada e reescrita pela Inteligência Artificial.
                        </p>
                    </button>
                </div>
            </Modal>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex items-center gap-3">
                {isRenaming ? (
                     <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onBlur={handleRename} onKeyDown={(e) => e.key === 'Enter' && handleRename()} className="text-2xl font-bold bg-transparent border-b-2 border-primary focus:outline-none" autoFocus/>
                ) : (
                    <>
                    <h2 className="text-2xl md:text-3xl font-bold">{session.title || `Sessão de ${new Date(session.data).toLocaleDateString()}`}</h2>
                    <button onClick={() => setIsRenaming(true)} className="p-1 text-text-secondary hover:text-white"><EditIcon className="w-5 h-5"/></button>
                    </>
                )}
            </div>
        </div>
        
        {session.practiceAttempts && session.practiceAttempts.length > 0 && (
          <Card>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex items-center gap-2 text-text-secondary font-semibold"><HistoryIcon className="w-5 h-5"/> Linha do Tempo da Prática:</div>
                  <div className="flex flex-wrap items-center gap-2">
                      <button onClick={() => setViewingIndex('original')} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${viewingIndex === 'original' ? 'bg-secondary text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Original</button>
                      {session.practiceAttempts.map((_, index) => (
                          <button key={index} onClick={() => setViewingIndex(index)} className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${viewingIndex === index ? 'bg-secondary text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>Tentativa {index + 1}</button>
                      ))}
                  </div>
              </div>
          </Card>
        )}
        
        <div className="border-b border-card-border/50 flex items-center gap-2 overflow-x-auto pb-1">
            <TabButton label="Resumo" isActive={activeTab === 'summary'} onClick={() => setActiveTab('summary')} />
            <TabButton label="Análise Detalhada" isActive={activeTab === 'details'} onClick={() => setActiveTab('details')} />
            <TabButton label="Transcrição" isActive={activeTab === 'transcript'} onClick={() => setActiveTab('transcript')} />
            {hasQAHistory && (
                <TabButton label="Simulação Q&A" isActive={activeTab === 'qa'} onClick={() => setActiveTab('qa')} />
            )}
        </div>

        <div className="mt-8">
            {renderContent()}
        </div>

    </div>
  );
};

export default AnalysisReportComponent;