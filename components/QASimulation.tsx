import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob as GenAI_Blob } from '@google/genai';
import { Chat } from '@google/genai';
import { Session, Persona, QAInteraction } from '../types';
import { startQASession, sendAnswerToQASession } from '../services/geminiService';
import { LoadingIcon, MicIcon, StopIcon, InvestorIcon, ClientIcon, JournalistIcon } from './icons';
import { useSettings } from '../contexts/SettingsContext';

interface QAContext {
  session: Session;
  persona: Persona;
}

interface QASimulationProps {
  context: QAContext;
  onComplete: (interactions: QAInteraction[]) => void;
  onCancel: () => void;
}

type SimulationState = 'initializing' | 'waiting_for_ai' | 'ai_question_received' | 'recording_answer' | 'processing_answer' | 'completed' | 'error';
const MAX_QUESTIONS = 3;

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


export const QASimulation: React.FC<QASimulationProps> = ({ context, onComplete, onCancel }) => {
  const { apiKey } = useSettings();
  const [state, setState] = useState<SimulationState>('initializing');
  const [interactions, setInteractions] = useState<QAInteraction[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<Chat | null>(null);
  const sessionPromiseRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptBufferRef = useRef('');

  const getPersonaIcon = () => {
    const className = "w-12 h-12 text-primary flex-shrink-0";
    switch (context.persona.id) {
        case 'investor': return <InvestorIcon className={className} />;
        case 'client': return <ClientIcon className={className} />;
        case 'journalist': return <JournalistIcon className={className} />;
        default: return null;
    }
  };

  const initializeChat = useCallback(async () => {
    try {
      const chat = await startQASession(context.session.transcricao, context.persona);
      chatRef.current = chat;
      
      setState('waiting_for_ai');
      const initialResponse = await chat.sendMessage({ message: "Faça a primeira pergunta." });
      setCurrentQuestion(initialResponse.text || 'Desculpe, não consegui pensar em uma pergunta. Por favor, tente novamente.');
      setState('ai_question_received');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido ao iniciar o chat.');
      setState('error');
    }
  }, [context]);

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);


  const stopLiveSession = useCallback(() => {
    sessionPromiseRef.current?.then((session: any) => session.close());
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    sessionPromiseRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
  }, []);

  const processAnswer = async (userAnswer: string) => {
    try {
      setState('processing_answer');
      const aiResponseText = await sendAnswerToQASession(chatRef.current!, userAnswer);

      const lines = aiResponseText.split('\n').filter(line => line.trim() !== '');
      const feedback = lines[0] || "Análise concluída.";
      const nextQuestion = lines.slice(1).join('\n').trim();

      const newInteraction: QAInteraction = {
          persona: context.persona.name,
          question: currentQuestion,
          userAnswer,
          feedback,
      };
      
      const updatedInteractions = [...interactions, newInteraction];
      setInteractions(updatedInteractions);

      if (updatedInteractions.length >= MAX_QUESTIONS || !nextQuestion) {
          setState('completed');
          onComplete(updatedInteractions);
      } else {
          setCurrentQuestion(nextQuestion);
          setState('ai_question_received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar sua resposta.");
      setState('error');
    }
  };

  const handleStopRecording = () => {
    stopLiveSession();
    processAnswer(transcriptBufferRef.current);
  };
  
  const handleStartRecording = async () => {
    setState('recording_answer');
    setError(null);
    transcriptBufferRef.current = '';

    try {
        if(!apiKey) throw new Error("API Key não encontrada.");
        const ai = new GoogleGenAI({ apiKey });

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

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
                  transcriptBufferRef.current += message.serverContent.inputTranscription.text;
                }
              },
              onerror: (e: ErrorEvent) => {
                setError("Erro na conexão com a IA.");
                setState('error');
              },
              onclose: () => {},
            },
            config: { responseModalities: [Modality.AUDIO], inputAudioTranscription: {} },
        });

    } catch (err) {
      setError("Não foi possível acessar o microfone.");
      setState('error');
    }
  };
  
  useEffect(() => {
    return () => stopLiveSession();
  }, [stopLiveSession]);

  const renderContent = () => {
      if (state === 'error') {
          return (
              <div className="text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <button onClick={onCancel} className="px-6 py-2 bg-slate-600 hover:bg-slate-500 rounded-full">Voltar ao Relatório</button>
              </div>
          )
      }

      if (state === 'initializing' || state === 'waiting_for_ai' || state === 'processing_answer') {
          let message = 'Iniciando simulação...';
          if (state === 'waiting_for_ai') message = `${context.persona.name} está formulando uma pergunta...`;
          if (state === 'processing_answer') message = 'Analisando sua resposta...';

          return (
              <div className="flex flex-col items-center text-center">
                  <LoadingIcon className="w-16 h-16 text-primary animate-spin" />
                  <p className="mt-4 text-text-secondary">{message}</p>
              </div>
          )
      }

      return (
          <>
            <div className="w-full bg-card p-6 rounded-lg mb-8 shadow-card">
              <div className="flex items-start gap-4">
                  {getPersonaIcon()}
                  <div>
                      <h3 className="font-bold text-text-primary">{context.persona.name} Pergunta:</h3>
                      <p className="text-text-primary text-lg mt-2">{currentQuestion}</p>
                  </div>
              </div>
            </div>

            {interactions.length > 0 && (
                <div className="w-full space-y-2 mb-8 max-h-48 overflow-y-auto">
                    {interactions.slice().reverse().map((interaction, index) => (
                        <div key={index} className="p-3 bg-background/50 rounded-lg opacity-50">
                            <p className="text-sm text-text-secondary font-semibold">Sua Resposta Anterior:</p>
                            <p className="text-sm text-text-secondary italic">"{interaction.userAnswer}"</p>
                            <p className="text-xs text-indigo-300 mt-1">Feedback: {interaction.feedback}</p>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col items-center justify-center">
                {state === 'ai_question_received' && (
                    <button onClick={handleStartRecording} className="group flex items-center justify-center w-24 h-24 bg-primary rounded-full shadow-lg hover:bg-primary-hover transition-all duration-300 transform hover:scale-105">
                        <MicIcon className="w-10 h-10 text-white" />
                    </button>
                )}
                {state === 'recording_answer' && (
                     <button onClick={handleStopRecording} className="group flex items-center justify-center w-24 h-24 bg-red-600 rounded-full shadow-lg hover:bg-red-500 transition-all duration-300">
                        <StopIcon className="w-10 h-10 text-white" />
                    </button>
                )}
                <p className="mt-4 text-text-secondary h-6">
                    {state === 'recording_answer' ? 'Gravando... Clique para parar.' : 'Clique para gravar sua resposta.'}
                </p>
            </div>
          </>
      )
  }

  return (
    <div className="w-full max-w-2xl text-center animate-fade-in">
        <button onClick={onCancel} className="text-sm text-text-secondary hover:text-text-primary mb-6 transition-colors duration-300">‹ Cancelar e Voltar</button>
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Simulação de Q&A</h2>
        <p className="text-text-secondary mb-8">Pergunta <span className="font-bold text-primary">{interactions.length + 1}</span> de {MAX_QUESTIONS}</p>
        
        {renderContent()}
    </div>
  )
};