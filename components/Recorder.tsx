import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAI_Blob } from '@google/genai';
import { analyzeSession, analyzePracticeAttempt, transcribeAudio } from '../services/geminiService';
import { Session, PracticeAttempt, AnalysisMode, User } from '../types';
import { MicIcon, StopIcon, AnalyzeIcon, LoadingIcon, PlayIcon, PauseIcon } from './icons';
import { useUser } from '../contexts/UserContext';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from './common/Toast';

interface PracticeContext {
  session: Session;
  previousTranscript: string;
}

interface ScriptedPracticeContext {
  coachId?: string;
  script: string;
}

interface RecorderProps {
  onAnalysisComplete: (session: Session) => void;
  onPracticeComplete: (attempt: PracticeAttempt, originalSessionId: string) => void;
  practiceContext?: PracticeContext | null;
  scriptedPracticeContext?: ScriptedPracticeContext | null;
  onCancelPractice: () => void;
  analysisMode?: AnalysisMode;
  allSessions: Session[];
  sessionTopic?: string;
}

type RecordingState = 'idle' | 'permission' | 'recording' | 'stopped' | 'analyzing' | 'error';
const MAX_RECORDING_SECONDS = 300; // 5 minutes

function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array): GenAI_Blob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}

// Função auxiliar para detectar o melhor formato suportado pelo navegador
const getSupportedMimeType = (): string => {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4', // Importante para Safari/iOS
        'audio/ogg;codecs=opus',
        'audio/wav'
    ];
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return ''; // Deixa o navegador decidir o padrão se nenhum específico for encontrado
};

export const Recorder: React.FC<RecorderProps> = ({ 
  onAnalysisComplete, 
  onPracticeComplete, 
  practiceContext, 
  scriptedPracticeContext,
  onCancelPractice,
  analysisMode = 'standard',
  allSessions,
  sessionTopic
}) => {
  const { user } = useUser();
  const { isApiKeySet, apiKey } = useSettings();
  const { showToast } = useToast();

  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [analysisProgress, setAnalysisProgress] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isAutoScrollPaused, setIsAutoScrollPaused] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const sessionPromiseRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const scriptContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef(0);
  const transcriptBufferRef = useRef('');
  const audioChunksRef = useRef<Blob[]>([]);
  // Armazena o mimeType escolhido na inicialização para usar ao criar o Blob final
  const mimeTypeRef = useRef<string>(''); 

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);
  
  const isRePracticeMode = !!practiceContext;
  const isScriptedPracticeMode = !!scriptedPracticeContext;

  const getTargetScript = useCallback(() => {
    if (isRePracticeMode) return practiceContext.session.relatorio.textoOtimizado;
    if (isScriptedPracticeMode) return scriptedPracticeContext.script;
    return null;
  }, [isRePracticeMode, isScriptedPracticeMode, practiceContext, scriptedPracticeContext]);

  useEffect(() => {
    let animationFrameId: number | null = null;
    const scrollLoop = () => {
        const script = getTargetScript();
        const container = scriptContainerRef.current;
        const isRecordingAndNotPaused = recordingState === 'recording' && !isAutoScrollPaused;
        
        if (isRecordingAndNotPaused && script && container) {
            const WPM = 150;
            const wordCount = script.trim().split(/\s+/).length;
            const estimatedDurationInSeconds = (wordCount / WPM) * 60;
            const scrollableHeight = container.scrollHeight - container.clientHeight;
            if (estimatedDurationInSeconds > 0 && scrollableHeight > 0) {
                const progress = timerRef.current / estimatedDurationInSeconds;
                const newScrollTop = Math.min(progress * scrollableHeight, scrollableHeight);
                container.scrollTop = newScrollTop;
            }
        }
        animationFrameId = requestAnimationFrame(scrollLoop);
    };

    if (recordingState === 'recording') {
        scrollLoop();
    } else {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }
    return () => {
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [recordingState, isAutoScrollPaused, getTargetScript]);


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const stopLiveSession = useCallback(() => {
    sessionPromiseRef.current?.then((session: any) => session.close());
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    sessionPromiseRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); // This triggers onstop, which handles the rest.
    }
    // IMPORTANT: Add a small delay before closing the live session.
    // This allows the final transcription chunks (which arrive slightly after audio stops)
    // to be received and appended to the buffer.
    setTimeout(() => {
        stopLiveSession();
    }, 1000);
  }, [stopLiveSession]);
  
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setTimer(prev => {
         if (prev >= MAX_RECORDING_SECONDS) {
            stopRecording();
            return MAX_RECORDING_SECONDS;
         }
        return prev + 1;
      });
    }, 1000);
  }, [stopRecording]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);
  
  const startRecording = async () => {
    setRecordingState('permission');
    setError(null);
    setAudioBlob(null);
    setFinalTranscript('');
    transcriptBufferRef.current = '';
    audioChunksRef.current = [];
    setIsAutoScrollPaused(false);
    
    if (!isApiKeySet) {
      const errorMsg = "API Key do Google Gemini não configurada.";
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setRecordingState('error');
      return;
    }
    const ai = new GoogleGenAI({ apiKey });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Determine the best supported mime type
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType; // Store for onstop
      
      const options = mimeType ? { mimeType } : undefined;
      
      try {
          mediaRecorderRef.current = new MediaRecorder(stream, options);
      } catch (e) {
          console.warn("MediaRecorder creation failed with options, trying default", e);
          mediaRecorderRef.current = new MediaRecorder(stream);
          mimeTypeRef.current = ''; // Fallback to browser default
      }

      mediaRecorderRef.current.ondataavailable = event => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
      };

      mediaRecorderRef.current.onstop = () => {
        // Create blob with the correctly detected mimeType
        const finalBlob = new Blob(audioChunksRef.current, { 
            type: mimeTypeRef.current || 'audio/webm' 
        });
        setAudioBlob(finalBlob);
        setFinalTranscript(transcriptBufferRef.current); 
        setRecordingState('stopped');
        stopTimer();
      };

      // For live transcription
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      sessionPromiseRef.current = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromiseRef.current!.then((session: any) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              transcriptBufferRef.current += text;
            }
          },
          onerror: (e: ErrorEvent) => { 
            console.error("Live session error", e);
            // Don't stop recording completely on live error, we still have the blob
            showToast("Conexão instável com Transcrição Ao Vivo. A análise final usará o áudio gravado.", 'info');
          },
          onclose: () => console.log("Live session closed."),
        },
        config: { responseModalities: [Modality.AUDIO], inputAudioTranscription: {} },
      });

      mediaRecorderRef.current.start();
      setTimer(0);
      startTimer();
      setRecordingState('recording');

    } catch (err) {
      console.error("Error accessing microphone:", err);
      const errorMsg = "Permissão para usar o microfone foi negada ou dispositivo não encontrado.";
      setError(errorMsg);
      showToast(errorMsg, 'error');
      setRecordingState('error');
    }
  };

  const handleAnalysis = async () => {
    // Safety check for duration
    if (timer < 3) {
        const errorMsg = "Gravação muito curta. Fale por pelo menos 3 segundos para uma análise precisa.";
        setError(errorMsg);
        showToast(errorMsg, 'info');
        return;
    }

    if (!audioBlob || !user) {
        const errorMsg = "Não foi possível capturar o áudio. Tente novamente.";
        setError(errorMsg);
        showToast(errorMsg, 'error');
        return;
    }

    setError(null);
    try {
        setRecordingState('analyzing');
        
        // 1. Transcribe audio from the full blob to ensure completeness
        setAnalysisProgress('Garantindo fidelidade do áudio...');
        
        // Pass the blob directly; service will detect mimeType from blob.type
        const fullTranscript = await transcribeAudio(audioBlob);
        
        if (!fullTranscript || fullTranscript.trim().length === 0) {
             throw new Error("A IA não conseguiu ouvir nada no áudio gravado. Verifique seu microfone.");
        }

        // 2. Proceed with analysis using the reliable transcript
        setAnalysisProgress('IA está analisando...');

        if (isRePracticeMode) {
            const newAttempt = await analyzePracticeAttempt(fullTranscript, audioBlob, timer, practiceContext.session, allSessions, user);
            setAnalysisProgress('Finalizando...');
            onPracticeComplete(newAttempt, practiceContext.session.id);
        } else {
            // Priority:
            // 1. Explicit topic provided by user
            // 2. "Prática de Roteiro" if scripted
            // 3. Fallback to timestamp
            const defaultTitle = sessionTopic && sessionTopic.trim() !== ''
              ? sessionTopic
              : (isScriptedPracticeMode ? `Prática de Roteiro` : `Gravação de Áudio #${Date.now().toString().slice(-4)}`);
            
            const newSession = await analyzeSession(
                fullTranscript,
                audioBlob,
                timer,
                analysisMode as AnalysisMode, 
                allSessions,
                user,
                defaultTitle, 
                scriptedPracticeContext?.script
            );
            setAnalysisProgress('Finalizando...');
            onAnalysisComplete(newSession);
        }
    } catch (err) {
        console.error("Analysis failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido durante a análise.";
        setError(errorMessage);
        showToast(errorMessage, 'error');
        setRecordingState('error');
    } finally {
        setAnalysisProgress(null);
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      stopLiveSession();
      if(mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, [stopTimer, stopLiveSession]);
  
  const getHeader = () => {
      if (isRePracticeMode) return "Praticando a Versão Melhorada";
      if (isScriptedPracticeMode) return `Prática com Roteiro`;
      // Se tiver um tópico, mostre ele no cabeçalho
      if (sessionTopic && sessionTopic.trim() !== '') return `Praticando: ${sessionTopic}`;
      return "Gravação Livre por Áudio";
  }

  const getStatusMessage = () => {
    switch (recordingState) {
        case 'permission': return 'Aguardando permissão do microfone...';
        case 'analyzing': return analysisProgress || 'Analisando...';
        case 'stopped': return 'Gravação finalizada. Pronto para analisar.';
        default: return 'Pronto para gravar.';
    }
  };
  
  const circumference = 2 * Math.PI * 56; // radius = 56
  const progress = Math.min(timer / MAX_RECORDING_SECONDS, 1);
  const offset = circumference - progress * circumference;
  const targetScript = getTargetScript();

  return (
    <div className="w-full h-full flex flex-col items-center p-4">
      <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4 flex-shrink-0 text-center">{getHeader()}</h2>
      <div className="w-full flex-grow flex flex-col md:flex-row gap-6 md:gap-8 items-stretch min-h-0">
        {targetScript ? (
          <div className="flex-grow flex flex-col bg-card border border-card-border rounded-lg shadow-card min-h-0">
            <div className="flex justify-between items-center p-4 border-b border-card-border flex-shrink-0">
              <h3 className="text-lg font-semibold text-primary">Roteiro para Prática</h3>
              {recordingState === 'recording' && (
                <button
                  onClick={() => setIsAutoScrollPaused(prev => !prev)}
                  className="p-2 rounded-full bg-slate-700/50 hover:bg-slate-700 transition-colors"
                  title={isAutoScrollPaused ? "Retomar rolagem automática" : "Pausar rolagem automática"}
                >
                  {isAutoScrollPaused
                    ? <PlayIcon className="w-4 h-4 text-white" />
                    : <PauseIcon className="w-4 h-4 text-white" />}
                </button>
              )}
            </div>
            <div ref={scriptContainerRef} className="flex-grow text-text-secondary text-left text-xl md:text-2xl leading-relaxed md:leading-loose p-6 md:p-8 overflow-y-auto scroll-smooth">
              {targetScript}
            </div>
          </div>
        ) : (
            <div className="flex-grow flex flex-col items-center justify-center bg-card border border-card-border rounded-lg shadow-card p-6">
                <MicIcon className="w-16 h-16 text-slate-600" />
                <p className="mt-4 text-text-secondary text-center">Nenhum roteiro para esta sessão.</p>
                <p className="text-slate-500 text-center">Clique no botão para começar a gravação livre.</p>
            </div>
        )}

        <div className={`flex-shrink-0 flex flex-col items-center justify-center gap-4 p-4 rounded-lg shadow-card md:w-72 ${targetScript ? 'bg-card border border-card-border' : ''}`}>
           <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 120 120" style={{ transform: 'scale(1.2)' }}>
                <circle className="text-slate-700" strokeWidth="4" stroke="currentColor" fill="transparent" r="56" cx="60" cy="60" />
                <circle
                  className="text-primary"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="56"
                  cx="60"
                  cy="60"
                  transform="rotate(-90 60 60)"
                />
              </svg>
              {recordingState === 'recording' && <div className="absolute inset-0 bg-red-500/30 rounded-full animate-pulse"></div>}
              <div className="absolute text-3xl sm:text-4xl font-mono text-white tracking-widest">{formatTime(timer)}</div>
          </div>
          <p className="text-sm text-text-secondary">Limite: {formatTime(MAX_RECORDING_SECONDS)}</p>
          
          <div className="min-h-[96px] flex flex-col items-center justify-center">
            <div className="flex items-center gap-4">
              {recordingState === 'idle' && (
                  <button onClick={startRecording} className="group flex items-center justify-center w-24 h-24 bg-primary rounded-full shadow-lg hover:bg-primary-hover transition-all duration-300 transform hover:scale-105" title="Gravar com Microfone">
                      <MicIcon className="w-10 h-10 text-white" />
                  </button>
              )}
              {recordingState === 'recording' && (
                  <button onClick={stopRecording} className="group flex items-center justify-center w-24 h-24 bg-red-600 rounded-full shadow-lg hover:bg-red-500 transition-all duration-300">
                      <StopIcon className="w-10 h-10 text-white" />
                  </button>
              )}
              {recordingState === 'stopped' && (
                  <button onClick={handleAnalysis} className="group flex items-center justify-center w-24 h-24 bg-secondary rounded-full shadow-lg hover:bg-secondary-hover transition-all duration-300">
                      <AnalyzeIcon className="w-10 h-10 text-white" />
                  </button>
              )}
              {(recordingState === 'permission' || recordingState === 'analyzing') && (
                  <div className="flex items-center justify-center w-24 h-24 bg-slate-700 rounded-full">
                      <LoadingIcon className="w-10 h-10 text-white animate-spin" />
                  </div>
              )}
              {recordingState === 'error' && (
                  <button onClick={onCancelPractice} className="group flex items-center justify-center w-24 h-24 bg-accent rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" /></svg>
                  </button>
              )}
            </div>
            <p className="mt-6 text-text-secondary transition-opacity duration-300 min-h-[24px] text-center">
                {recordingState !== 'error' ? getStatusMessage() : ''}
            </p>
            {error && <p className="mt-2 text-red-400 max-w-xs text-center">{error}</p>}
          </div>
            {(isRePracticeMode || isScriptedPracticeMode) && (
               <button onClick={onCancelPractice} className="mt-auto px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded-full font-semibold transition-colors duration-300 text-sm">Cancelar</button>
            )}
        </div>
      </div>
    </div>
  );
};