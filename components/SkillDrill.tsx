import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAI_Blob } from '@google/genai';
import { GoalType, SkillDrillExercise, User } from '../types';
import { generateSkillDrillExercise, analyzeSkillDrillAttempt, transcribeAudio } from '../services/geminiService';
import { LoadingIcon, MicIcon, StopIcon, CoachIcon, RefreshCw } from './icons';
import { useUser } from '../contexts/UserContext';
import { useSettings } from '../contexts/SettingsContext';

interface SkillDrillProps {
    goalType: GoalType;
    onComplete: () => void;
    onCancel: () => void;
    preGeneratedDrill?: SkillDrillExercise[];
    onDrillConsumed?: (goalType: GoalType) => void;
}

type DrillState = 'loading' | 'ready' | 'recording' | 'analyzing' | 'feedback' | 'finished' | 'error';

const goalTitles: Record<GoalType, string> = {
    clarity: 'Treino de Clareza',
    filler_words: 'Treino de Vícios de Linguagem',
    wpm: 'Treino de Ritmo',
    intonation_variety: 'Treino de Variação de Entonação'
};

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

export const SkillDrill: React.FC<SkillDrillProps> = ({ goalType, onComplete, onCancel, preGeneratedDrill, onDrillConsumed }) => {
    const { user } = useUser();
    const { apiKey } = useSettings();
    const [state, setState] = useState<DrillState>('loading');
    const [exercises, setExercises] = useState<SkillDrillExercise[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingText, setLoadingText] = useState('Preparando seu treino focado...');

    const sessionPromiseRef = useRef<any>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const transcriptBufferRef = useRef(''); // Mantemos como fallback visual se necessário
    
    // Refs para gravação paralela (Correção do corte de áudio)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (!user) return;
        if (preGeneratedDrill && preGeneratedDrill.length > 0) {
            setExercises(preGeneratedDrill);
            setState('ready');
            onDrillConsumed?.(goalType);
            return;
        }
        const fetchExercises = async () => {
            try {
                setLoadingText('Consultando o Agente de IA para criar exercícios...');
                const fetchedExercises = await generateSkillDrillExercise(goalType);
                setLoadingText('Validando o material de treino...');
                await new Promise(resolve => setTimeout(resolve, 700));
                if (fetchedExercises.length === 0) throw new Error("A IA não conseguiu gerar exercícios. Tente novamente.");
                setExercises(fetchedExercises);
                setState('ready');
            } catch (err) {
                setError(err instanceof Error ? err.message : "Erro desconhecido.");
                setState('error');
            }
        };
        fetchExercises();
    }, [goalType, user, preGeneratedDrill, onDrillConsumed]);

    const stopLiveSession = () => {
        sessionPromiseRef.current?.then((session: any) => session.close());
        streamRef.current?.getTracks().forEach(track => track.stop());
        audioContextRef.current?.close();
        sessionPromiseRef.current = null;
        streamRef.current = null;
        audioContextRef.current = null;
    };
    
    const analyzeTranscript = async (transcript: string) => {
        try {
            setState('analyzing');
            const result = await analyzeSkillDrillAttempt(goalType, exercises[currentIndex].challenge, transcript);
            setFeedback({ success: result.success, text: result.feedback });
            setState('feedback');
        } catch (err) {
            setError("Falha ao analisar sua tentativa.");
            setState('ready');
        }
    };

    const handleStartRecording = async () => {
        setState('recording');
        setError(null);
        transcriptBufferRef.current = '';
        audioChunksRef.current = []; // Limpa chunks anteriores

        try {
            if(!apiKey) throw new Error("API Key não encontrada.");
            const ai = new GoogleGenAI({ apiKey });

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // 1. Configura MediaRecorder para gravar o arquivo completo (Alta Fidelidade)
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
            }
            
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.start();

            // 2. Configura Live API para feedback visual (Baixa Latência)
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                  onopen: () => {
                    const source = audioContextRef.current!.createMediaStreamSource(stream);
                    const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                      const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                      sessionPromiseRef.current!.then((session: any) => {
                        session.sendRealtimeInput({ media: createBlob(inputData) });
                      });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(audioContextRef.current!.destination);
                  },
                  onmessage: (message: LiveServerMessage) => {
                    if (message.serverContent?.inputTranscription) {
                      transcriptBufferRef.current += message.serverContent.inputTranscription.text;
                    }
                  },
                  onerror: (e: ErrorEvent) => { 
                      console.error("Live API Error:", e);
                      // Não paramos o fluxo aqui, confiamos no MediaRecorder
                  },
                  onclose: () => {},
                },
                config: { responseModalities: [Modality.AUDIO], inputAudioTranscription: {} },
            });
        } catch (err) {
            setError("Permissão para microfone negada.");
            setState('ready');
        }
    };

    const handleStopRecording = () => {
        // Para o Live Session
        stopLiveSession();

        // Para o MediaRecorder e aguarda o blob final
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.onstop = async () => {
                try {
                    setState('analyzing');
                    const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
                    
                    // Transcreve o áudio completo para garantir que não houve cortes
                    const fullTranscript = await transcribeAudio(audioBlob);
                    
                    if (!fullTranscript || fullTranscript.trim().length === 0) {
                        // Fallback para o buffer do Live API se a transcrição do blob falhar (raro)
                        if (transcriptBufferRef.current.trim().length > 0) {
                            await analyzeTranscript(transcriptBufferRef.current);
                        } else {
                            throw new Error("Áudio vazio.");
                        }
                    } else {
                        await analyzeTranscript(fullTranscript);
                    }
                } catch (e) {
                    console.error("Erro ao processar áudio:", e);
                    setError("Erro ao processar áudio. Tente novamente.");
                    setState('ready');
                }
            };
            mediaRecorderRef.current.stop();
        }
    };

    const handleNext = () => {
        if (currentIndex < exercises.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setFeedback(null);
            setState('ready');
        } else {
            setState('finished');
        }
    };

    const handleRetry = () => {
        setFeedback(null);
        setState('ready');
    };

    useEffect(() => {
        return () => stopLiveSession();
    }, []);

    const currentExercise = exercises[currentIndex];
    const progressPercentage = exercises.length > 0 ? ((currentIndex + 1) / exercises.length) * 100 : 0;

    if (state === 'loading') {
        return (
            <div className="text-center">
                <LoadingIcon className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="mt-4 text-text-secondary">{loadingText}</p>
            </div>
        );
    }
    
    if (state === 'error') {
        return (
             <div className="text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <button onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded-full">Voltar</button>
            </div>
        )
    }

    if (state === 'finished') {
         return (
             <div className="text-center max-w-lg mx-auto">
                <h2 className="text-3xl font-bold text-primary mb-4">Treino Concluído!</h2>
                <p className="text-text-secondary mb-8">Ótimo trabalho! A repetição é a chave para a maestria. Continue praticando para solidificar suas novas habilidades.</p>
                <button onClick={onComplete} className="px-8 py-3 bg-primary hover:bg-primary-hover rounded-full font-semibold">Voltar para Jornada</button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">{goalTitles[goalType]}</h2>
            <p className="text-text-secondary mb-4">Exercício {currentIndex + 1} de {exercises.length}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-700 rounded-full h-2.5 mb-8">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
            </div>

            <div className="w-full bg-card p-6 rounded-lg mb-8 shadow-card min-h-[150px] flex flex-col justify-center">
                <p className="text-sm text-text-secondary mb-2">{currentExercise.instruction}</p>
                <p className="text-xl font-semibold text-text-primary">"{currentExercise.challenge}"</p>
            </div>
            
            <div className="flex flex-col items-center justify-center min-h-[150px]">
                {state === 'ready' && (
                    <button onClick={handleStartRecording} className="group flex items-center justify-center w-20 h-20 bg-primary rounded-full shadow-lg hover:bg-primary-hover transition-all duration-300 transform hover:scale-105">
                        <MicIcon className="w-8 h-8 text-white" />
                    </button>
                )}
                 {state === 'recording' && (
                     <button onClick={handleStopRecording} className="group flex items-center justify-center w-20 h-20 bg-red-600 rounded-full shadow-lg hover:bg-red-500 transition-all duration-300 animate-pulse">
                        <StopIcon className="w-8 h-8 text-white" />
                    </button>
                )}
                {(state === 'analyzing') && (
                    <div className="flex items-center justify-center w-20 h-20 bg-slate-700 rounded-full">
                        <LoadingIcon className="w-8 h-8 text-white animate-spin" />
                    </div>
                )}
                 {state === 'feedback' && feedback && (
                    <div className="animate-fade-in text-center w-full">
                        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg mb-6 ${feedback.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                            <CoachIcon className="w-5 h-5 flex-shrink-0" />
                            <p className="font-semibold">{feedback.text}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button 
                                onClick={handleRetry} 
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-full font-semibold transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tentar Novamente
                            </button>
                            <button 
                                onClick={handleNext} 
                                className={`px-6 py-3 rounded-full font-semibold transition-colors ${feedback.success ? 'bg-primary hover:bg-primary-hover text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`}
                            >
                                {currentIndex < exercises.length - 1 
                                    ? (feedback.success ? "Próximo Exercício" : "Pular Exercício") 
                                    : "Finalizar Treino"
                                }
                            </button>
                        </div>
                    </div>
                 )}
                 <p className="mt-4 text-text-secondary h-6 text-sm">
                    {state === 'recording' && 'Gravando...'}
                    {state === 'analyzing' && 'Analisando...'}
                </p>
            </div>
            
            {state !== 'feedback' && (
                <button onClick={onCancel} className="mt-8 text-sm text-text-secondary hover:text-text-primary transition-colors">Sair do Treino</button>
            )}
        </div>
    );
};
