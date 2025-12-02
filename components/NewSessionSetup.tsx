import React, { useState, useEffect } from 'react';
import { AnalysisMode, User } from '../types';
import { LoadingIcon, MicIcon, TextFileIcon, SalesIcon, TechIcon, StorytellerIcon, CoachIcon, RecordIcon } from './icons';
import { useUser } from '../contexts/UserContext';

interface NewSessionSetupProps {
    onStartPractice: (topic: string, script: string | null, mode: AnalysisMode) => void;
    onBack: () => void;
}

// FIX: Changed icon type from React.ReactNode to React.ReactElement for type safety with React.cloneElement
const analysisModes: { id: AnalysisMode; name: string; description: string; icon: React.ReactElement }[] = [
    { id: 'standard', name: 'Padrão', description: 'Feedback geral sobre clareza, ritmo e impacto.', icon: <CoachIcon className="w-6 h-6" /> },
    { id: 'sales', name: 'Vendas', description: 'Foco em persuasão, confiança e conversão.', icon: <SalesIcon className="w-6 h-6" /> },
    { id: 'technical', name: 'Técnico', description: 'Foco em precisão e estrutura lógica.', icon: <TechIcon className="w-6 h-6" /> },
    { id: 'storytelling', name: 'Storytelling', description: 'Foco em arco narrativo e impacto emocional.', icon: <StorytellerIcon className="w-6 h-6" /> },
];


export const NewSessionSetup: React.FC<NewSessionSetupProps> = ({ onStartPractice, onBack }) => {
    const { user } = useUser();
    const [topic, setTopic] = useState('');
    const [script, setScript] = useState<string | null>(null);
    const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('standard');
    
    const handleStart = () => {
        // Passa o tópico exatamente como digitado (ou string vazia)
        // Deixa o componente Recorder decidir o título padrão se estiver vazio
        onStartPractice(topic, script, analysisMode);
    };

    if (!user) {
        return <LoadingIcon className="w-8 h-8 animate-spin" />;
    }

    return (
        <div className="w-full max-w-2xl animate-fade-in space-y-8">
             <div className="text-center">
                <button onClick={onBack} className="text-sm text-text-secondary hover:text-text-primary mb-4 transition-colors duration-300">‹ Voltar para o Painel</button>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Configurar Nova Sessão</h2>
                <p className="text-text-secondary max-w-2xl mx-auto mt-2">Vamos preparar seu próximo treino.</p>
            </div>

            <div className="bg-card border border-card-border rounded-lg p-6 shadow-card space-y-6">
                {/* Step 1: Topic */}
                <div>
                    <label htmlFor="session-topic" className="block text-lg font-semibold text-text-primary mb-2">
                       <span className="text-primary mr-2">1.</span> Qual o tópico da sua apresentação?
                    </label>
                    <input
                        id="session-topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Ex: Pitch de Vendas Q4, Demo da Nova Feature, etc."
                        className="w-full px-4 py-2 bg-background/70 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                 {/* Step 2: Script or Freestyle */}
                <div>
                    <label className="block text-lg font-semibold text-text-primary mb-3">
                       <span className="text-primary mr-2">2.</span> Você já tem um roteiro?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setScript(script === null ? '' : null)}
                            className={`p-4 rounded-md border-2 transition-colors ${script !== null ? 'bg-primary/20 border-primary' : 'bg-slate-700/50 border-transparent hover:border-slate-500'}`}
                        >
                            <TextFileIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="font-semibold">Sim, vou colar o roteiro</span>
                        </button>
                        <button
                            onClick={() => setScript(null)}
                            className={`p-4 rounded-md border-2 transition-colors ${script === null ? 'bg-primary/20 border-primary' : 'bg-slate-700/50 border-transparent hover:border-slate-500'}`}
                        >
                            <MicIcon className="w-8 h-8 mx-auto mb-2" />
                            <span className="font-semibold">Não, vou falar livremente</span>
                        </button>
                    </div>
                    {script !== null && (
                        <textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="Cole seu roteiro aqui..."
                            className="w-full h-32 p-3 mt-4 bg-background/70 border border-slate-600 rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    )}
                </div>
                
                 {/* Step 3: Analysis Mode */}
                 <div>
                     <label className="block text-lg font-semibold text-text-primary mb-3">
                       <span className="text-primary mr-2">3.</span> Qual é o foco da sua análise?
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {analysisModes.map(mode => (
                            <button
                                key={mode.id}
                                onClick={() => setAnalysisMode(mode.id)}
                                className={`p-3 rounded-md border-2 text-center transition-colors ${analysisMode === mode.id ? 'bg-primary/20 border-primary' : 'bg-slate-700/50 border-transparent hover:border-slate-500'}`}
                                title={mode.description}
                            >
                                {/* FIX: Cast icon to a type that explicitly includes className to resolve TypeScript error with cloneElement. */}
                                {React.cloneElement(mode.icon as React.ReactElement<{ className?: string }>, { className: 'w-6 h-6 mx-auto mb-1' })}
                                <span className="text-sm font-semibold">{mode.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="text-center">
                 <button
                    onClick={handleStart}
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-secondary rounded-full hover:bg-secondary-hover transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-secondary/30 transform hover:-translate-y-1"
                >
                    <RecordIcon className="w-6 h-6" />
                    Começar a Praticar
                </button>
            </div>
        </div>
    );
};