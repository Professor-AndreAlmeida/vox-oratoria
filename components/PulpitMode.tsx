import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon as X, PlayIcon as Play, PauseIcon as Pause, MicIcon as Mic, StopCircleIcon, Download, RecordIcon, BrainCircuit, LoadingIcon as Loader, Save, Send, Lightbulb, Projector, CheckSquare, Image, RefreshCw } from './icons';
import { convertMarkdownToHtml, convertHtmlToMarkdown } from '../utils/conversion';
import {
  generateProactiveSuggestions,
  generatePulpitImage,
  generatePulpitTextStream,
} from '../services/geminiService';
import { ProactiveSuggestion, User } from '../types';
import Modal from './common/Modal';
import MarkdownViewer from './common/MarkdownViewer';
// FIX: Changed import path for Button component to the correct location.
import { Button } from './ui/button';
import { useUser } from '../contexts/UserContext';


interface PulpitModeProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  onSave: (newContent: string) => void;
}

type AiAction = 'idle' | 'text_query' | 'fact' | 'question' | 'image' | 'proactive';

const PulpitMode: React.FC<PulpitModeProps> = ({ isOpen, onClose, title, content, onSave }) => {
  const { user } = useUser();
  const [rehearsalContent, setRehearsalContent] = useState(content);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [viewMode, setViewMode] = useState<'rehearsal' | 'pulpit'>('rehearsal');
  const [showHelper, setShowHelper] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);
  const [teleprompterTime, setTeleprompterTime] = useState(0);
  const teleprompterTimeRef = useRef(0);
  const teleprompterIntervalRef = useRef<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<number | null>(null);
  const [permissionError, setPermissionError] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoadingState, setAiLoadingState] = useState<AiAction>('idle');
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    title: '',
    content: '',
    type: 'text' as 'text' | 'image',
  });
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [isAnalyzingForSuggestions, setIsAnalyzingForSuggestions] = useState(false);
  const [textToReplace, setTextToReplace] = useState<string | null>(null);
  const [currentProactivePrompt, setCurrentProactivePrompt] = useState<{ prompt: string, title: string } | null>(null);
  
  useEffect(() => {
    setRehearsalContent(content);
  }, [content]);

   useEffect(() => {
    teleprompterTimeRef.current = teleprompterTime;
  }, [teleprompterTime]);

  useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
        setShowHelper(true);
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
        if (teleprompterIntervalRef.current) clearInterval(teleprompterIntervalRef.current);
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
    };
  }, [isOpen]);

  const handleAnalyzeSuggestions = async () => {
      if (!rehearsalContent || !user || isAnalyzingForSuggestions) return;
      
      setIsAnalyzingForSuggestions(true);
      setProactiveSuggestions([]); // Limpa sugestões anteriores para evitar conflito de posição
      
      try {
          const suggestions = await generateProactiveSuggestions(rehearsalContent, user.styleProfile);
          setProactiveSuggestions(suggestions);
      } catch (error) {
          console.error("Failed to get proactive suggestions:", error);
      } finally {
          setIsAnalyzingForSuggestions(false);
      }
  };

  const stopTeleprompterTimer = useCallback(() => {
    if (teleprompterIntervalRef.current) clearInterval(teleprompterIntervalRef.current);
  }, []);

  const startTeleprompterTimer = useCallback(() => {
      stopTeleprompterTimer();
      teleprompterIntervalRef.current = window.setInterval(() => {
          setTeleprompterTime(prev => prev + 1);
      }, 1000);
  }, [stopTeleprompterTimer]);
  
  useEffect(() => {
      if (isPlaying) {
          startTeleprompterTimer();
      } else {
          stopTeleprompterTimer();
      }
  }, [isPlaying, startTeleprompterTimer, stopTeleprompterTimer]);


  useEffect(() => {
    let animationFrameId: number | null = null;
    const WPM_MAP = { 0.5: 100, 1: 150, 1.5: 200 };
    const WPM = WPM_MAP[speed as keyof typeof WPM_MAP] || 150;
    
    const scrollLoop = () => {
        const container = contentRef.current;
        if (isPlaying && rehearsalContent && container) {
            const wordCount = rehearsalContent.trim().split(/\s+/).length;
            const estimatedDurationInSeconds = (wordCount / WPM) * 60;
            const scrollableHeight = container.scrollHeight - container.clientHeight;

            if (estimatedDurationInSeconds > 0 && scrollableHeight > 0) {
                const progress = teleprompterTimeRef.current / estimatedDurationInSeconds;
                container.scrollTop = Math.min(progress * scrollableHeight, scrollableHeight);

                if (progress >= 1) {
                    setIsPlaying(false);
                }
            } else {
                setIsPlaying(false);
            }
        }
        animationFrameId = requestAnimationFrame(scrollLoop);
    };
    
    scrollLoop();

    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, rehearsalContent, speed]);
  
  const togglePlay = () => {
      const container = contentRef.current;
      if (!isPlaying && container && container.scrollTop + container.clientHeight >= container.scrollHeight) {
          handleResetTeleprompter();
          setTimeout(() => setIsPlaying(true), 50); 
      } else {
          setIsPlaying(!isPlaying);
      }
  };

  const handleSpeedChange = () => {
      setSpeed(prev => {
          if (prev === 1) return 1.5;
          if (prev === 1.5) return 0.5;
          return 1;
      });
  };

  const handleResetTeleprompter = () => {
      if (contentRef.current) contentRef.current.scrollTop = 0;
      setIsPlaying(false);
      setTeleprompterTime(0);
  };
  
  const handleSave = () => {
    setSaveStatus('saving');
    onSave(rehearsalContent);
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const applyStyleProfile = (baseInstruction: string, profile?: string): string => {
    if (!profile) return baseInstruction;
    return `${baseInstruction}\n\nINSTRUÇÃO ADICIONAL: Adapte sua resposta para se alinhar com o perfil de estilo de comunicação deste usuário. Perfil do Usuário: "${profile}"`;
  };

  const handleGenerateScript = async () => {
    if (!user) return;
    setIsGeneratingScript(true);
    setProactiveSuggestions([]);
    setShowHelper(false);
    const systemInstruction = applyStyleProfile(`Aja como um roteirista de discursos e coach de comunicação. Transforme os tópicos ou rascunho em um discurso coeso e impactante. Foque em criar uma narrativa com fluxo, storytelling e ganchos para engajar a audiência. Adicione sugestões de pausas ou interações (ex: "Neste momento, olhe para a audiência e faça uma pausa."). Mantenha a essência do conteúdo, mas adicione uma linguagem natural e poderosa para um orador. Retorne APENAS o roteiro em formato Markdown.`, user.styleProfile);

    const prompt = `
      Tópicos Originais para transformar em discurso:
      ---
      ${rehearsalContent}
      ---
    `;

    try {
        const stream = await generatePulpitTextStream(prompt, systemInstruction);
        let fullText = "";
        setRehearsalContent("");
        for await (const chunk of stream) {
            fullText += chunk.text;
            setRehearsalContent(prev => prev + chunk.text);
        }
    } catch (err) {
        console.error("Script generation failed:", err);
        setRehearsalContent(rehearsalContent + "\n\n**Erro ao gerar o roteiro.**");
    } finally {
        setIsGeneratingScript(false);
    }
  };

  const startRecording = async () => {
    setPermissionError('');
    setAudioURL(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => audioChunks.push(event.data);

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = window.setInterval(() => {
          setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setPermissionError('Permissão para microfone negada.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if(recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      setRecordingTime(0);
    }
  };

  const resetRecording = () => {
      setAudioURL(null);
      setPermissionError('');
  };

   const handleAiInteraction = useCallback(async (type: AiAction, customPrompt?: string, modalTitleOverride?: string, originalTextToReplace?: string) => {
      if (aiLoadingState !== 'idle' || !user) return;

      setAiLoadingState(type);
      
      let modalTitle = modalTitleOverride || '';
      let prompt = customPrompt || '';
      
      // Se for uma sugestão proativa, configura o estado para substituição
      if (type === 'proactive' && originalTextToReplace) {
          setTextToReplace(originalTextToReplace);
          // Salva o prompt atual para o botão "Gerar Nova"
          setCurrentProactivePrompt({ prompt: customPrompt || '', title: modalTitleOverride || '' });
          
          // Abre o modal imediatamente com estado de carregamento
          setResponseModal({ 
              isOpen: true, 
              title: "Co-piloto trabalhando...", 
              content: "", // Conteúdo vazio inicial para mostrar loading
              type: 'text' 
          });
      } else {
          setTextToReplace(null);
          setCurrentProactivePrompt(null);
      }

      try {
        if (type === 'image') {
          modalTitle = 'Ilustração do Conceito';
          prompt = customPrompt || `Uma ilustração em estilo de aquarela, vibrante e impactante, representando o conceito principal do discurso sobre: "${title}". A imagem deve ser clara, conceitual e adequada para uma apresentação.`;
          
          const base64ImageBytes = await generatePulpitImage(prompt);
          const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
          setResponseModal({ isOpen: true, title: modalTitle, content: imageUrl, type: 'image' });

        } else {
            let systemInstructionText = `Aja como um 'ponto eletrônico' para um palestrante que está fazendo uma apresentação sobre "${title}". Forneça uma resposta rápida e concisa para a pergunta do orador.`;

            if (!customPrompt) {
                switch (type) {
                    case 'fact':
                        modalTitle = 'Dado de Impacto';
                        prompt = `Para um discurso sobre "${title}", gere um dado de impacto ou um fato surpreendente para fortalecer o argumento do orador. Seja direto, conciso e memorável. Formate em Markdown.`;
                        break;
                    case 'question':
                        modalTitle = 'Pergunta de Impacto para a Audiência';
                        prompt = `Para um discurso sobre "${title}", crie uma "pergunta de impacto" (retórica ou direta) para engajar a audiência e fazê-la refletir. Não forneça respostas, apenas a pergunta. Formate em Markdown.`;
                        break;
                    case 'text_query':
                    default:
                        modalTitle = 'Ponto Eletrônico';
                        prompt = `CONTEXTO DO DISCURSO: --- ${rehearsalContent} --- PERGUNTA: ${aiQuery}`;
                        break;
                }
            } else if (type === 'proactive') {
                modalTitle = modalTitleOverride || 'Sugestão do Co-piloto';
                prompt = customPrompt;
                // INSTRUÇÃO ESTRITA PARA RETORNAR APENAS UMA FRASE
                systemInstructionText = `Você é um editor de texto preciso. O usuário pediu para reescrever uma frase específica.
                SUA TAREFA: Retorne APENAS A NOVA VERSÃO da frase.
                REGRAS:
                1. NÃO dê múltiplas opções. Escolha a melhor.
                2. NÃO use introduções ("Aqui está", "Sugiro").
                3. NÃO use aspas na resposta.
                4. O texto deve estar pronto para substituir o original.
                5. Se o usuário pedir para simplificar, simplifique. Se pedir impacto, dê impacto.`;
            }

            const systemInstruction = applyStyleProfile(systemInstructionText, user.styleProfile);
            const responseStream = await generatePulpitTextStream(prompt, systemInstruction);
            
            let fullText = "";
            for await (const chunk of responseStream) {
                fullText += chunk.text;
                // Atualiza o modal em tempo real enquanto o stream chega
                setResponseModal(prev => ({ 
                    ...prev, 
                    isOpen: true, 
                    title: modalTitle,
                    content: prev.content + chunk.text 
                }));
            }
            setResponseModal({ isOpen: true, title: modalTitle, content: fullText, type: 'text' });
        }

      } catch (err) {
        console.error("AI Interaction failed:", err);
        const errorMessage = err instanceof Error ? err.message : 'Falha ao se comunicar com a IA.';
        setResponseModal({ isOpen: true, title: 'Erro', content: `Ocorreu um erro: ${errorMessage}`, type: 'text' });
      } finally {
        setAiLoadingState('idle');
        setAiQuery('');
      }
  }, [aiLoadingState, aiQuery, rehearsalContent, title, user]);
  
  const handleRegenerateSuggestion = () => {
      if (currentProactivePrompt && textToReplace) {
          // Limpa o conteúdo atual para mostrar loading visualmente
          setResponseModal(prev => ({ ...prev, content: '' }));
          handleAiInteraction('proactive', currentProactivePrompt.prompt, currentProactivePrompt.title, textToReplace);
      }
  };

  const handleApplySuggestion = () => {
      if (textToReplace && responseModal.content) {
          // Substitui apenas a primeira ocorrência para evitar trocar texto errado se houver duplicatas
          // O trim() é importante para evitar espaços extras indesejados
          const newContent = rehearsalContent.replace(textToReplace, responseModal.content.trim());
          setRehearsalContent(newContent);
          closeResponseModal();
          // Limpa sugestões pois os índices/textos mudaram
          setProactiveSuggestions([]);
      }
  };

  const handleAskAiSubmit = () => {
    if (!aiQuery.trim()) return;
    handleAiInteraction('text_query');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAskAiSubmit();
    }
  };

  const closeResponseModal = () => {
      setResponseModal(prev => ({ ...prev, isOpen: false }));
      setTextToReplace(null);
      setCurrentProactivePrompt(null);
  };
  
  const renderContentWithSuggestions = useCallback(() => {
    if (viewMode !== 'rehearsal' || proactiveSuggestions.length === 0) {
        return <div dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(rehearsalContent) }} />;
    }
    
    let remainingText = rehearsalContent;
    const parts: React.ReactNode[] = [];
    
    const sortedSuggestions = [...proactiveSuggestions].sort((a,b) => rehearsalContent.indexOf(a.originalText) - rehearsalContent.indexOf(b.originalText));

    sortedSuggestions.forEach((suggestion, i) => {
        const index = remainingText.indexOf(suggestion.originalText);
        if (index > -1) {
            const before = remainingText.substring(0, index);
            if (before) parts.push(<span key={`text-before-${i}`} dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(before) }} />);
            
            const suggestionButton = (
                <span className="relative inline" key={`sugg-${i}`}>
                    <span className="bg-primary/20 rounded p-1" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(suggestion.originalText) }}></span>
                    <button 
                        onClick={() => handleAiInteraction('proactive', suggestion.promptForNextStep, suggestion.suggestionTitle, suggestion.originalText)}
                        disabled={aiLoadingState !== 'idle'}
                        className="absolute -top-3 -right-3 z-10 p-1 bg-secondary text-secondary-foreground rounded-full shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                        title={suggestion.suggestionTitle}
                    >
                        <Lightbulb className="w-4 h-4" />
                    </button>
                </span>
            );
            parts.push(suggestionButton);
            remainingText = remainingText.substring(index + suggestion.originalText.length);
        }
    });

    if (remainingText) parts.push(<span key="text-after" dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(remainingText) }} />);
    
    return <>{parts}</>;
  }, [rehearsalContent, proactiveSuggestions, viewMode, aiLoadingState, handleAiInteraction]);


  const ModeButton: React.FC<{
    targetMode: 'pulpit' | 'rehearsal';
    label: string;
    icon: React.ReactNode;
  }> = ({ targetMode, label, icon }) => (
    <button
      onClick={() => setViewMode(targetMode)}
      className={`flex items-center gap-2 px-3 py-1 text-sm font-bold transition-colors rounded-sm ${
        viewMode === targetMode
          ? 'bg-primary text-primary-foreground'
          : 'bg-transparent text-muted-foreground hover:bg-muted/50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const ActionButton: React.FC<{ type: AiAction; label: string; icon: React.ReactNode; }> = ({ type, label, icon }) => (
    <Button
        onClick={() => handleAiInteraction(type)}
        variant="ghost"
        className="w-auto text-xs flex-col h-auto py-2 px-3"
        isLoading={aiLoadingState === type}
        disabled={aiLoadingState !== 'idle'}
        title={label}
    >
        {icon}
        <span className="mt-1">{label}</span>
    </Button>
  );


  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-background z-[100] flex flex-col" role="dialog" aria-modal="true">
        <header className="flex justify-between items-center p-4 border-b-2 border-border flex-shrink-0 bg-card">
            <h2 className="text-xl font-bold text-foreground uppercase truncate">{title}</h2>
            <div className="flex items-center gap-4">
                 <div className="flex items-center p-1 bg-muted rounded-md border-2 border-border">
                    <ModeButton targetMode="rehearsal" label="Ensaio" icon={<Mic className="w-4 h-4" />} />
                    <ModeButton targetMode="pulpit" label="Púlpito" icon={<Projector className="w-4 h-4" />} />
                 </div>
                 <div className="flex items-center gap-2">
                    {saveStatus === 'saved' && <p className="text-xs font-mono text-green-500 animate-pulse">Salvo!</p>}
                    <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving' || isGeneratingScript || isPlaying}
                        className="flex items-center px-3 py-1 text-sm bg-card hover:bg-muted border-2 border-border transition-colors uppercase font-bold disabled:cursor-not-allowed rounded-md"
                        title="Salvar alterações no conteúdo"
                    >
                        {saveStatus === 'saving' ? <Loader className="w-4 h-4 mr-2 animate-spin"/> : <Save className="w-4 h-4 mr-2"/>}
                        Salvar
                    </button>
                </div>
                 <button
                    onClick={onClose}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                    aria-label="Fechar"
                 >
                    <X className="w-6 h-6" />
                </button>
            </div>
        </header>
        
        <div className="flex-grow relative min-h-0">
            {viewMode === 'rehearsal' && showHelper && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
                    onClick={() => setShowHelper(false)}
                >
                    <div 
                        className="w-full max-w-md bg-card border-2 border-primary/50 p-6 shadow-2xl rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center">
                            <Lightbulb className="w-12 h-12 text-primary mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-foreground mb-3">Bem-vindo ao Modo Ensaio!</h3>
                            <p className="text-text-secondary mb-6">
                                Use o botão <BrainCircuit className="inline w-4 h-4 -mt-1" /> para transformar tópicos em roteiro, ou o botão <Lightbulb className="inline w-4 h-4 -mt-1" /> para pedir ao Co-piloto para analisar seu texto e dar sugestões.
                            </p>
                            <button 
                                onClick={() => setShowHelper(false)} 
                                className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-full font-semibold transition-colors"
                            >
                                Entendi, vamos começar!
                            </button>
                        </div>
                    </div>
                </div>
            )}
             {viewMode === 'rehearsal' && isAnalyzingForSuggestions && (
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2 text-xs font-mono bg-card/90 backdrop-blur-sm border-2 border-border p-2 rounded-lg text-primary animate-pulse">
                    <Loader className="w-4 h-4 animate-spin"/>
                    <span>Co-piloto analisando...</span>
                </div>
            )}
            <div 
                ref={contentRef} 
                contentEditable={!isGeneratingScript && !isPlaying && viewMode === 'rehearsal'}
                suppressContentEditableWarning={true}
                onInput={(e) => {
                  setProactiveSuggestions([]);
                  setRehearsalContent(convertHtmlToMarkdown(e.currentTarget.innerHTML))
                }}
                className={`w-full h-full p-8 md:p-12 overflow-y-scroll text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-relaxed md:leading-relaxed lg:leading-relaxed font-serif prose prose-invert max-w-none focus:outline-none ${viewMode === 'rehearsal' ? 'focus:ring-2 focus:ring-primary rounded-md' : ''}`}
            >
                {renderContentWithSuggestions()}
            </div>
        </div>

        <footer className="flex-shrink-0 bg-card border-t-2 border-border p-3 flex flex-col items-center justify-center gap-3">
            {viewMode === 'pulpit' && (
                <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-3">
                     <div className="flex items-center justify-center gap-2 border-b-2 border-border pb-3 mb-2 w-full">
                         <p className="text-xs font-bold uppercase text-muted-foreground mr-2">Ações Rápidas:</p>
                        <ActionButton type="fact" label="Dado de Impacto" icon={<Lightbulb className="w-5 h-5" />} />
                        <ActionButton type="question" label="Pergunta de Impacto" icon={<CheckSquare className="w-5 h-5" />} />
                        <ActionButton type="image" label="Ilustrar Conceito" icon={<Image className="w-5 h-5" />} />
                    </div>
                     <div className="w-full flex items-center gap-2">
                        <input
                            name="ai-query"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Peça uma ajuda ao seu Ponto Eletrônico de IA..."
                            className="w-full px-4 py-2 text-sm bg-background border-2 border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-md"
                            disabled={aiLoadingState !== 'idle'}
                            autoComplete="off"
                        />
                         <button
                            onClick={handleAskAiSubmit}
                            disabled={!aiQuery.trim() || aiLoadingState !== 'idle'}
                            className="flex-shrink-0 p-3 border-2 border-border shadow-sm text-primary-foreground bg-primary hover:brightness-90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all active:translate-y-px rounded-md"
                            aria-label="Perguntar à IA"
                        >
                            {aiLoadingState === 'text_query' ? <Loader className="animate-spin h-5 w-5" /> : <Send className="w-5 h-5"/>}
                        </button>
                    </div>
                </div>
            )}

            {viewMode === 'rehearsal' && (
                <>
                {audioURL ? (
                    <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                        <audio src={audioURL} controls className="w-full max-w-md"></audio>
                        <div className="flex items-center gap-2">
                            <a href={audioURL} download={`ensaio-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.webm`} className="flex items-center px-4 py-2 text-sm bg-card hover:bg-muted border-2 border-border transition-colors uppercase font-bold rounded-md">
                               <Download className="w-4 h-4 mr-2"/> Baixar Áudio
                            </a>
                            <button onClick={resetRecording} className="flex items-center px-4 py-2 text-sm bg-card hover:bg-muted border-2 border-border transition-colors uppercase font-bold rounded-md">
                               <RecordIcon className="w-4 h-4 mr-2"/> Nova Gravação
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center gap-4 sm:gap-6">
                        <div className="relative hidden sm:block">
                            <button onClick={handleSpeedChange} className="px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground" disabled={isRecording || isGeneratingScript}>
                                VELOCIDADE ({speed}x)
                            </button>
                        </div>

                        <div className="relative flex gap-3">
                            <button
                                onClick={handleGenerateScript}
                                disabled={isRecording || isPlaying || isGeneratingScript || isAnalyzingForSuggestions}
                                className="p-3 rounded-full shadow-lg border-2 border-border disabled:bg-muted disabled:cursor-not-allowed bg-card text-card-foreground"
                                aria-label="Gerar Roteiro de Ensaio"
                                title="Gerar roteiro de fala a partir do plano"
                            >
                                {isGeneratingScript ? <Loader className="w-6 h-6 animate-spin"/> : <BrainCircuit className="w-6 h-6"/>}
                            </button>

                            <button
                                onClick={handleAnalyzeSuggestions}
                                disabled={isRecording || isPlaying || isGeneratingScript || isAnalyzingForSuggestions}
                                className="p-3 rounded-full shadow-lg border-2 border-border disabled:bg-muted disabled:cursor-not-allowed bg-card text-card-foreground"
                                aria-label="Analisar Texto (Co-piloto)"
                                title="Pedir sugestões de melhoria ao Co-piloto"
                            >
                                {isAnalyzingForSuggestions ? <Loader className="w-6 h-6 animate-spin"/> : <Lightbulb className="w-6 h-6"/>}
                            </button>
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={togglePlay} 
                                className="p-4 bg-primary text-primary-foreground rounded-full shadow-lg border-2 border-border disabled:bg-muted disabled:cursor-not-allowed"
                                aria-label={isPlaying ? "Pausar" : "Iniciar"}
                                disabled={isGeneratingScript || isAnalyzingForSuggestions}
                                title="Iniciar/Pausar Teleprompter"
                            >
                                {isPlaying ? <Pause className="w-8 h-8"/> : <Play className="w-8 h-8"/>}
                            </button>
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isPlaying || isGeneratingScript || isAnalyzingForSuggestions}
                                className={`p-3 rounded-full shadow-lg border-2 border-border disabled:bg-muted disabled:cursor-not-allowed ${isRecording ? 'bg-destructive text-destructive-foreground' : 'bg-card text-card-foreground'}`}
                                aria-label={isRecording ? "Parar Gravação" : "Gravar Ensaio"}
                                title="Gravar áudio da apresentação"
                            >
                                {isRecording ? <StopCircleIcon className="w-6 h-6"/> : <Mic className="w-6 h-6"/>}
                            </button>
                        </div>

                        <div className="relative hidden sm:block">
                            <button onClick={handleResetTeleprompter} className="px-4 py-2 text-xs font-mono text-muted-foreground hover:text-foreground" disabled={isRecording || isGeneratingScript}>
                                REINICIAR
                            </button>
                        </div>
                    </div>
                )}
                {permissionError && <p className="text-destructive text-sm font-mono mt-2">{permissionError}</p>}
                </>
            )}
        </footer>
        
        {responseModal.isOpen && (
            <Modal
                isOpen={responseModal.isOpen}
                onClose={closeResponseModal}
                title={responseModal.title}
                footer={
                    <div className="flex gap-2 justify-end w-full">
                        {textToReplace ? (
                            <>
                                <Button 
                                    onClick={handleRegenerateSuggestion} 
                                    variant="outline" 
                                    disabled={aiLoadingState !== 'idle'}
                                    className="mr-auto"
                                    title="Tentar gerar uma opção diferente"
                                >
                                    {aiLoadingState === 'proactive' ? <Loader className="w-4 h-4 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2" />}
                                    Gerar Nova Opção
                                </Button>
                                <Button onClick={closeResponseModal} variant="ghost">Cancelar</Button>
                                <Button onClick={handleApplySuggestion} className="bg-green-600 hover:bg-green-500 text-white">
                                    <CheckSquare className="w-4 h-4 mr-2" /> Aceitar
                                </Button>
                            </>
                        ) : (
                            <Button onClick={closeResponseModal} className="w-auto">Fechar</Button>
                        )}
                    </div>
                }
            >
                {responseModal.type === 'image' ? (
                     <div className="p-4 bg-black">
                        <img src={responseModal.content} alt="Conteúdo gerado por IA" className="max-w-full max-h-[65vh] mx-auto border-2 border-border" />
                    </div>
                ) : (
                    <div className="max-h-[65vh] overflow-y-auto bg-background p-4">
                        {(!responseModal.content && aiLoadingState !== 'idle') ? (
                            <div className="flex items-center justify-center p-8 text-text-secondary">
                                <Loader className="w-6 h-6 animate-spin mr-2"/>
                                <span>Criando...</span>
                            </div>
                        ) : textToReplace ? (
                            <div className="flex flex-col gap-2">
                                <p className="text-xs text-text-secondary font-bold uppercase mb-1">Sugestão de melhoria:</p>
                                <textarea
                                    className="w-full h-[30vh] p-4 bg-background border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary text-xl leading-relaxed font-serif"
                                    value={responseModal.content}
                                    onChange={(e) => setResponseModal(prev => ({ ...prev, content: e.target.value }))}
                                />
                            </div>
                        ) : (
                            <MarkdownViewer markdown={responseModal.content} />
                        )}
                    </div>
                )}
            </Modal>
        )}
    </div>,
    document.body
  );
};

export default PulpitMode;