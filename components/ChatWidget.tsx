import React, { useState, useRef, useEffect } from 'react';
import { getHelpFromVoxAgent } from '../services/geminiService';
import { AgentResponse } from '../types';
import { HelpIcon, CloseIcon, Send, LoadingIcon, UserIcon, LogoIcon } from './icons';
import MarkdownViewer from './common/MarkdownViewer';

interface Message {
    author: 'user' | 'ai';
    text: string;
    action?: AgentResponse['navigation_action'];
}

interface ChatWidgetProps {
    onNavigate: (targetPage: 'dashboard' | 'new_session' | 'history' | 'journey' | 'settings' | 'tutorial') => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { author: 'ai', text: "Olá! Sou o Guia vOx, seu especialista na plataforma. Como posso ajudar você a dominar sua oratória hoje?" }
    ]);
    const [userInput, setUserInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async () => {
        const query = userInput.trim();
        if (!query || isLoading) return;

        setUserInput('');
        setMessages(prev => [...prev, { author: 'user', text: query }]);
        setIsLoading(true);
        
        try {
            const aiResponse = await getHelpFromVoxAgent(query);
            setMessages(prev => [...prev, { 
                author: 'ai', 
                text: aiResponse.response_text,
                action: aiResponse.navigation_action
            }]);
        } catch (error) {
             console.error("Error getting help from vOx agent:", error);
             setMessages(prev => [...prev, {
                 author: 'ai',
                 text: "Desculpe, estou com um problema de conexão no momento. Tente novamente em alguns instantes."
             }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-[100] w-16 h-16 bg-primary rounded-full text-white shadow-lg hover:bg-primary-hover transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
                aria-label="Abrir Guia de Ajuda vOx"
            >
                {isOpen ? <CloseIcon className="w-8 h-8" /> : <HelpIcon className="w-8 h-8" />}
            </button>

            {isOpen && (
                <div className="fixed bottom-24 right-6 z-[100] w-[90vw] max-w-md h-[70vh] max-h-[600px] bg-card border-2 border-border rounded-xl shadow-2xl flex flex-col" style={{ animation: 'fade-in-up 0.3s ease-out' }}>
                    <header className="p-4 border-b-2 border-border flex items-center gap-3 flex-shrink-0">
                        <LogoIcon className="w-8 h-8 text-indigo-400" />
                        <div>
                            <h3 className="font-bold text-lg text-foreground">Guia vOx</h3>
                            <p className="text-xs text-green-400 flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                Online
                            </p>
                        </div>
                    </header>
                    
                    <main className="flex-grow p-4 overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.author === 'user' ? 'justify-end' : ''}`}>
                                {msg.author === 'ai' && <div className="w-8 h-8 flex-shrink-0 bg-primary rounded-full flex items-center justify-center"><LogoIcon className="w-5 h-5 text-white"/></div>}
                                <div className={`max-w-xs md:max-w-sm rounded-lg p-3 ${msg.author === 'ai' ? 'bg-muted' : 'bg-primary text-primary-foreground'}`}>
                                    {msg.author === 'ai' ? (
                                        <MarkdownViewer markdown={msg.text} />
                                    ) : (
                                        <p>{msg.text}</p>
                                    )}
                                    {msg.action && (
                                        <button
                                            onClick={() => { onNavigate(msg.action!.target_page); setIsOpen(false); }}
                                            className="mt-3 w-full text-left px-3 py-2 text-sm bg-primary/20 text-primary-foreground rounded-md hover:bg-primary/40 transition-colors"
                                        >
                                            {msg.action.button_label} &rarr;
                                        </button>
                                    )}
                                </div>
                                 {msg.author === 'user' && <div className="w-8 h-8 flex-shrink-0 bg-slate-600 rounded-full flex items-center justify-center"><UserIcon className="w-5 h-5"/></div>}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 flex-shrink-0 bg-primary rounded-full flex items-center justify-center"><LogoIcon className="w-5 h-5 text-white"/></div>
                                <div className="max-w-xs md:max-w-sm rounded-lg p-3 bg-muted flex items-center gap-2">
                                    <LoadingIcon className="w-4 h-4 animate-spin"/>
                                    <span className="text-sm text-muted-foreground">Pensando...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </main>

                    <footer className="p-4 border-t-2 border-border flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                name="chat-input"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Pergunte sobre o vOx..."
                                className="w-full px-4 py-2 text-sm bg-background border-2 border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring rounded-full"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!userInput.trim() || isLoading}
                                className="flex-shrink-0 p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary-hover disabled:bg-muted disabled:cursor-not-allowed"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </footer>
                </div>
            )}
        </>
    );
};
