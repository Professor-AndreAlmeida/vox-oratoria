

import React from 'react';
import { Session } from '../types';

interface SharedReportViewerProps {
  session: Session;
}

// A simplified, read-only version of the AnalysisReport component
export const SharedReportViewer: React.FC<SharedReportViewerProps> = ({ session }) => {
  // O áudio não é incluído em visualizações compartilhadas para proteger a privacidade do usuário.

  const getSessionTitle = (s: Session) => {
    const formatDate = (isoString: string) => new Date(isoString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return s.title || (s.duracao === 'Texto' ? `Análise de ${formatDate(s.data)}` : `Gravação de ${formatDate(s.data)}`);
  };

  // FIX: Add guards for potentially missing data in shared reports to prevent crashes.
  // Using optional chaining (?.) to safely access properties on `session.relatorio`, which may be undefined in a shared context.
  // This prevents runtime errors and resolves TypeScript complaints about accessing properties on a potentially empty object.
  const relatorio = session.relatorio;
  const clareza = relatorio?.clareza || { nota: 0, justificativa: 'Análise indisponível.' };
  const palavrasPreenchimento = relatorio?.palavrasPreenchimento || [];
  const textoOtimizado = relatorio?.textoOtimizado || session.transcricao;

  return (
    <div className="w-full max-w-4xl p-6 bg-card border border-card-border rounded-lg shadow-lg animate-fade-in-up">
        <div className="text-center mb-6 border-b border-card-border/50 pb-4">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 text-transparent bg-clip-text">
                Relatório de Análise Compartilhado
            </h1>
            <p className="text-text-secondary mt-1">Sessão: {getSessionTitle(session)}</p>
        </div>
      
        <div className="space-y-6">
            <div className="bg-background/50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-primary">Transcrição Original</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{session.transcricao}</p>
            </div>
             <div className="bg-background/50 p-4 rounded-lg">
                <h2 className="text-lg font-semibold mb-2 text-primary">Texto Otimizado pela IA</h2>
                <p className="text-text-secondary whitespace-pre-wrap">{textoOtimizado}</p>
            </div>
            <div className="bg-background/50 p-4 rounded-lg text-center">
                 <p className="text-text-secondary">A nota de clareza foi <span className="font-bold text-lg text-primary">{clareza.nota}/10</span>.</p>
                 <p className="text-slate-500 text-sm mt-1">{clareza.justificativa}</p>
            </div>
            {palavrasPreenchimento.length > 0 && (
                 <div className="bg-background/50 p-4 rounded-lg">
                    <h2 className="text-lg font-semibold mb-2 text-primary">Vícios de Linguagem</h2>
                    <ul className="space-y-1 text-text-secondary">
                        {palavrasPreenchimento.map(fw => (
                            <li key={fw.palavra} className="flex justify-between items-center">
                                <span className="font-semibold capitalize">{fw.palavra}</span>
                                <span className="text-primary font-mono text-lg">{fw.contagem}x</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        <div className="mt-8 text-center text-xs text-text-secondary/70">
            <p>Este é um relatório somente leitura gerado pelo vOx Oratória. A reprodução de áudio não está disponível em links compartilhados para proteger a privacidade do usuário.</p>
        </div>
    </div>
  );
};