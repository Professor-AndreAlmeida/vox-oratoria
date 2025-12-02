import React from 'react';
import { LogoIcon } from '../icons';

interface AuthLayoutProps {
    title: string;
    description: string;
    children: React.ReactNode;
    onLogoClick: () => void;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, description, children, onLogoClick }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <button onClick={onLogoClick} className="inline-flex items-center gap-3 group">
                        <LogoIcon className="transition-transform duration-300 group-hover:scale-110" />
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">vOx Oratória</h1>
                    </button>
                </div>
                <div className="bg-card border border-card-border rounded-xl shadow-2xl p-10">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text mb-2">{title}</h2>
                        <p className="text-muted-foreground">{description}</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};