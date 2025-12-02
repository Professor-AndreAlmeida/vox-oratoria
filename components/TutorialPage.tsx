import React from 'react';
import { BookOpenIcon, RecordIcon, ClarityIcon, Projector, JourneyIcon, DashboardIcon, ShieldCheck, SettingsIcon } from './icons';

const StepCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-card border border-card-border rounded-xl p-6 shadow-card flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
            <div className="text-primary">{icon}</div>
            <h3 className="text-xl font-semibold text-text-primary">{title}</h3>
        </div>
        <div className="text-text-secondary flex-grow prose prose-invert max-w-none prose-p:my-2 prose-ul:list-disc prose-li:ml-4">{children}</div>
    </div>
);

export const TutorialPage: React.FC = () => {
    return (
        <div className="w-full max-w-7xl animate-fade-in space-y-12">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                <BookOpenIcon className="w-10 h-10 text-primary" />
                <div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Guia de Funcionalidades vOx</h2>
                    <p className="text-text-secondary mt-1">Domine sua plataforma de oratória Open Source e Local-First.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <StepCard icon={<DashboardIcon className="w-8 h-8"/>} title="Painel: Centro de Comando">
                    <p>Sua visão geral estratégica. Aqui você encontra:</p>
                    <ul>
                        <li><strong>Desafio Ativo:</strong> A missão atual criada pelo "Agente de Carreira" baseada no seu histórico.</li>
                        <li><strong>Resumo Semanal:</strong> Um botão para gerar, via IA, um relatório executivo sobre sua evolução nos últimos 7 dias.</li>
                        <li><strong>Início Rápido:</strong> Acesso direto para começar uma nova prática.</li>
                    </ul>
                </StepCard>

                <StepCard icon={<RecordIcon className="w-8 h-8"/>} title="Sessões & Gravador Híbrido">
                    <p>O coração do sistema. Configure o <strong>Tópico</strong> e o <strong>Modo</strong> (Vendas, Técnico, etc).</p>
                    <ul>
                        <li><strong>Tecnologia Híbrida:</strong> Usamos transcrição em tempo real (para você ver o texto) E gravação de alta fidelidade em paralelo. Isso garante que <strong>nenhuma palavra seja perdida</strong>, mesmo se a internet oscilar.</li>
                        <li><strong>Roteiro vs Livre:</strong> Cole um texto para usar o Teleprompter automático ou fale de improviso.</li>
                    </ul>
                </StepCard>

                <StepCard icon={<ClarityIcon />} title="Relatório de Análise Profunda">
                    <p>O diagnóstico imediato da IA sobre sua performance:</p>
                    <ul>
                        <li><strong>Métricas:</strong> Clareza, Ritmo (PPM), Vícios de Linguagem e Entonação.</li>
                        <li><strong>Texto Otimizado:</strong> A IA reescreve seu discurso para torná-lo mais impactante.</li>
                        <li><strong>Agente de Continuidade:</strong> No final do relatório, a IA sugere qual o <strong>Próximo Passo</strong> ideal (ex: "Treino de Ritmo" ou "Simulação Q&A") para corrigir a fraqueza detectada naquela sessão.</li>
                    </ul>
                </StepCard>
                
                <StepCard icon={<Projector className="w-8 h-8"/>} title="Laboratório de Refinamento">
                     <p>Ferramentas para levar sua oratória ao nível profissional:</p>
                    <ul>
                        <li><strong>Estúdio de Ensaio (Pulpit Mode):</strong> Um ambiente de foco total com Teleprompter e um "Co-piloto" que gera imagens e dados para enriquecer seu discurso.</li>
                        <li><strong>Simulação de Q&A:</strong> Teste sua argumentação contra Personas de IA (Investidor, Cliente, Jornalista) que fazem perguntas difíceis baseadas no que você falou.</li>
                    </ul>
                </StepCard>

                <StepCard icon={<JourneyIcon className="w-8 h-8"/>} title="Jornada & Gamificação Automática">
                    <p>Esqueça a gestão manual de metas. O vOx faz isso por você:</p>
                    <ul>
                        <li><strong>Agente de Carreira:</strong> A IA analisa seu histórico silenciosamente e cria <strong>Desafios Personalizados</strong> (ex: "Sprint de Clareza: Atingir nota 8 em 3 sessões").</li>
                        <li><strong>Ginásio (Skill Drills):</strong> Exercícios rápidos e isolados para corrigir vícios ou melhorar a dicção, gerados sob medida.</li>
                    </ul>
                </StepCard>

                <StepCard icon={<SettingsIcon className="w-8 h-8"/>} title="Configurações & Inteligência">
                    <p>Personalize o "cérebro" da plataforma:</p>
                    <ul>
                        <li><strong>Seleção de Modelo de IA:</strong> Escolha entre <strong>Gemini Flash</strong> (Rápido e Econômico/Grátis) ou <strong>Gemini Pro</strong> (Raciocínio Avançado e Nuances).</li>
                        <li><strong>Estilo do Coach:</strong> Defina se quer um feedback "Encorajador", "Analítico" ou "Técnico".</li>
                        <li><strong>Backup Manual:</strong> Como seus dados são locais, use "Exportar Dados" regularmente para garantir a segurança do seu histórico.</li>
                    </ul>
                </StepCard>

                <div className="lg:col-span-2">
                     <StepCard icon={<ShieldCheck className="w-8 h-8"/>} title="Privacidade Absoluta (Local-First)">
                        <p>O vOx opera com uma arquitetura <strong>Local-First & BYOK (Bring Your Own Key)</strong>:</p>
                        <ul>
                            <li><strong>Seus Dados:</strong> Áudios e textos ficam salvos no <strong>IndexedDB</strong> do seu navegador. Nada vai para nossos servidores.</li>
                            <li><strong>Sua Chave:</strong> A API Key conecta seu navegador <em>diretamente</em> ao Google. Nós não intermediamos e não temos acesso.</li>
                            <li><strong>Reset de Fábrica:</strong> Na "Zona de Perigo" das configurações, você pode apagar tudo e começar do zero se desejar.</li>
                        </ul>
                    </StepCard>
                </div>
            </div>
             <div className="text-center pt-8">
                <p className="text-text-secondary">Ainda com dúvidas? Use o <strong>Guia vOx</strong>, nosso agente de IA no canto da tela, para perguntar qualquer coisa sobre a plataforma!</p>
            </div>
        </div>
    );
};