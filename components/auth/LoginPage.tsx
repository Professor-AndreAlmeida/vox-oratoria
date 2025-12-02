import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { UserIcon, Sparkles } from '../icons';

interface LoginPageProps {
    onNavigate: (view: 'landing') => void;
    onGuestLogin: (name: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, onGuestLogin }) => {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onGuestLogin(name);
        }
    };

    return (
        <AuthLayout 
            title="Bem-vindo ao vOx" 
            description="Seu laboratório pessoal de oratória. Vamos começar?"
            onLogoClick={() => onNavigate('landing')}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-lg">Como podemos te chamar?</Label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                            id="name" 
                            type="text" 
                            placeholder="Seu nome ou apelido" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="pl-10 h-14 text-lg bg-background/50 border-primary/30 focus:border-primary transition-all" 
                            autoFocus
                            required
                        />
                    </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-text-secondary">
                    <p className="flex items-start gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>100% Local & Privado:</strong> Seus dados (áudios, análises) ficam salvos apenas neste navegador. Não enviamos nada para servidores externos.
                        </span>
                    </p>
                </div>

                <Button type="submit" className="w-full text-lg h-14 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" size="lg">
                    Entrar na Plataforma &rarr;
                </Button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-border text-center">
                <button 
                    onClick={() => onNavigate('landing')} 
                    className="text-sm text-muted-foreground hover:text-white transition-colors"
                >
                    Voltar para a página inicial
                </button>
            </div>
        </AuthLayout>
    );
};