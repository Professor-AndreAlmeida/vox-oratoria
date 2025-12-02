import React from 'react';
import { LogoIcon } from '../icons';

interface LegalLayoutProps {
    children: React.ReactNode;
    onBack: () => void;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({ children, onBack }) => {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <header className="sticky top-0 p-4 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
                <div className="container mx-auto flex justify-between items-center">
                    <button onClick={onBack} className="flex items-center gap-3">
                        <LogoIcon />
                        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">vOx Oratória</h1>
                    </button>
                    <button onClick={onBack} className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-full font-semibold transition-colors duration-300 text-sm">
                        ‹ Voltar
                    </button>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
                <article className="prose prose-invert lg:prose-lg max-w-4xl mx-auto">
                    {children}
                </article>
            </main>

            <footer className="border-t border-border py-8">
                <div className="container mx-auto px-4 text-center text-sm text-text-secondary">
                    <p>&copy; {new Date().getFullYear()} vOx Oratória. Desenvolvido por <a href="https://github.com/Professor-AndreAlmeida" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Professor André Almeida</a>.</p>
                </div>
            </footer>
        </div>
    );
};