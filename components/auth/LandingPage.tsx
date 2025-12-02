import React from 'react';
import { LogoIcon, RecordIcon, BrainCircuit, ShieldCheck, CloudIcon, CloudUploadIcon, AlertCircleIcon, SettingsIcon, UserIcon } from '../icons';

interface LandingPageProps {
    onStartAuth: () => void;
    onNavigateToLegal: (page: 'privacy' | 'terms') => void;
}

const InfoCard: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, className?: string }> = ({ icon, title, children, className = "" }) => (
    <div className={`bg-card/50 border border-border rounded-xl p-6 text-left hover:border-primary/50 transition-colors ${className}`}>
        <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-background rounded-lg border border-border text-primary">{icon}</div>
            <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <div className="text-text-secondary text-sm leading-relaxed space-y-2">
            {children}
        </div>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStartAuth, onNavigateToLegal }) => {
    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const href = e.currentTarget.getAttribute('href');
        if (href?.startsWith('#')) {
            e.preventDefault();
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    return (
        <div className="w-full bg-background text-foreground font-sans min-h-screen flex flex-col">
            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 p-4 z-50 bg-background/90 backdrop-blur-md border-b border-border/50">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <LogoIcon className="w-8 h-8 text-primary" />
                        <div>
                            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">vOx Oratória</h1>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full ml-2">Online • Local</span>
                        </div>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
                        <a href="#privacy" onClick={handleNavClick} className="hover:text-primary transition-colors">Privacidade & Dados</a>
                        <a href="#compatibility" onClick={handleNavClick} className="hover:text-primary transition-colors">Compatibilidade</a>
                        <a href="#contribute" onClick={handleNavClick} className="hover:text-primary transition-colors">Reportar Bugs</a>
                    </nav>
                    <div className="flex gap-4">
                        <a 
                            href="https://github.com/Professor-AndreAlmeida/vox-oratoria" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hidden md:flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors"
                        >
                            <CloudUploadIcon className="w-5 h-5" />
                            GitHub
                        </a>
                    </div>
                </div>
            </header>

            <main className="flex-grow pt-32 pb-20">
                {/* Hero Section */}
                <section className="container mx-auto px-4 text-center mb-24">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8 animate-fade-in-up">
                        <BrainCircuit className="w-4 h-4" />
                        Ambiente de Desenvolvimento Configurado com Sucesso
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                        Seu Laboratório de Oratória
                        <br />
                        <span className="text-primary">Instalado e Pronto.</span>
                    </h1>
                    
                    <p className="max-w-3xl mx-auto text-lg text-text-secondary mb-10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        Você está rodando a versão <strong>Open Source</strong> do vOx. Todo o poder da IA do Google Gemini, 
                        rodando diretamente no seu navegador, sem servidores intermediários e com total privacidade.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                        <button onClick={onStartAuth} className="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-primary-hover rounded-full font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-primary/20 flex items-center justify-center gap-2">
                            <RecordIcon className="w-5 h-5" />
                            Acessar Sistema
                        </button>
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-10 py-4 bg-card hover:bg-slate-700 border border-border rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2">
                            <SettingsIcon className="w-5 h-5" />
                            Gerar API Key
                        </a>
                    </div>
                </section>

                {/* Architecture & Privacy Grid */}
                <section id="privacy" className="container mx-auto px-4 mb-24">
                    <h2 className="text-3xl font-bold text-center mb-12">Como seus dados funcionam aqui?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoCard icon={<ShieldCheck className="w-6 h-6"/>} title="Arquitetura Local-First">
                            <p>O vOx foi construído seguindo a filosofia <strong>Local-First</strong>. Isso significa que não possuímos um banco de dados na nuvem para armazenar suas informações.</p>
                            <p className="mt-2 text-indigo-300 font-semibold">Tudo fica salvo no seu dispositivo.</p>
                        </InfoCard>

                        <InfoCard icon={<CloudIcon className="w-6 h-6"/>} title="Persistência via IndexedDB">
                            <p>Utilizamos o <strong>IndexedDB</strong>, um banco de dados poderoso dentro do seu navegador, para salvar seus áudios, transcrições e configurações.</p>
                            <p className="mt-2">⚠️ <strong>Atenção:</strong> Se você limpar os dados do navegador ou abrir em janela anônima, seus dados não estarão lá. Use a opção de <strong>Backup</strong> nas configurações.</p>
                        </InfoCard>

                        <InfoCard icon={<SettingsIcon className="w-6 h-6"/>} title="Modelo BYOK (Bring Your Own Key)">
                            <p>Para manter o projeto 100% gratuito e open-source, não cobramos assinatura. Você utiliza sua própria <strong>API Key do Google Gemini</strong>.</p>
                            <p className="mt-2">A chave é enviada diretamente do seu navegador para o Google. Nós nunca temos acesso a ela.</p>
                        </InfoCard>

                        <InfoCard icon={<UserIcon className="w-6 h-6"/>} title="Sem Login Tradicional">
                            <p>Como não temos servidores, não há sistema de "Login/Senha" para recuperar. A tela de entrada serve apenas para personalizar sua experiência localmente.</p>
                        </InfoCard>
                    </div>
                </section>

                {/* Compatibility Section */}
                <section id="compatibility" className="bg-card/30 py-20 mb-24 border-y border-border/50">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold mb-8">Compatibilidade de Navegadores</h2>
                        <p className="text-text-secondary max-w-2xl mx-auto mb-12">
                            O vOx utiliza tecnologias modernas de Web Audio API e WebSockets (Gemini Live) que funcionam melhor em navegadores baseados em Chromium.
                        </p>
                        
                        <div className="flex flex-wrap justify-center gap-8">
                            <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-xl border border-green-500/30 shadow-lg min-w-[150px]">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="font-bold text-lg">Google Chrome</span>
                                <span className="text-xs text-green-400">Recomendado</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-xl border border-green-500/30 shadow-lg min-w-[150px]">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="font-bold text-lg">Microsoft Edge</span>
                                <span className="text-xs text-green-400">Total Suporte</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-xl border border-green-500/30 shadow-lg min-w-[150px]">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="font-bold text-lg">Brave / Opera</span>
                                <span className="text-xs text-green-400">Total Suporte</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-xl border border-amber-500/30 min-w-[150px] opacity-80">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="font-bold text-lg">Firefox</span>
                                <span className="text-xs text-amber-400">Experimental</span>
                            </div>
                            <div className="flex flex-col items-center gap-3 p-6 bg-background rounded-xl border border-amber-500/30 min-w-[150px] opacity-80">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <span className="font-bold text-lg">Safari</span>
                                <span className="text-xs text-amber-400">Experimental</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contribute / Bugs Section */}
                <section id="contribute" className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-3xl p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
                        <div className="relative z-10">
                            <AlertCircleIcon className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
                            <h2 className="text-3xl md:text-4xl font-bold mb-4">Encontrou um Bug ou tem uma Ideia?</h2>
                            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
                                Este é um projeto colaborativo em constante evolução. Sua contribuição é essencial para torná-lo melhor para todos.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <a 
                                    href="https://github.com/Professor-AndreAlmeida/vox-oratoria/issues/new" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-8 py-3 bg-red-500/20 border border-red-500/50 text-red-200 rounded-full font-bold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                                >
                                    <AlertCircleIcon className="w-5 h-5" />
                                    Reportar um Bug
                                </a>
                                <a 
                                    href="https://github.com/Professor-AndreAlmeida/vox-oratoria" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <CloudUploadIcon className="w-5 h-5" />
                                    Contribuir no GitHub
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border py-12 bg-card/20 text-center">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col items-center justify-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <LogoIcon className="w-6 h-6" />
                            <span className="text-lg font-bold">vOx Oratória</span>
                        </div>
                        <div className="flex gap-4 text-sm text-text-secondary/70">
                            <button onClick={() => onNavigateToLegal('terms')} className="hover:text-primary">Termos de Uso</button>
                            <button onClick={() => onNavigateToLegal('privacy')} className="hover:text-primary">Privacidade</button>
                        </div>
                    </div>
                    <p className="text-xs text-text-secondary/50">
                        &copy; {new Date().getFullYear()} Desenvolvido com ❤️ por <a href="https://github.com/Professor-AndreAlmeida" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline">Professor André Almeida</a>.
                        <br/>
                        Distribuído sob licença MIT.
                    </p>
                </div>
            </footer>
        </div>
    );
};
