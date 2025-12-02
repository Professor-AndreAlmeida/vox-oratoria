// NOTA: Estes dados são estáticos e servem como um fallback para a UI enquanto a busca completa de dados
// do backend não está implementada em todos os componentes. A lógica de IA (prompts) já utiliza o backend.
import { Coach } from './types';

export const coaches: Coach[] = [
    { id: 'sales', name: 'Sofia Vendas', description: 'Especialista em pitches persuasivos e fechamento de negócios.' },
    { id: 'technical', name: 'Ricardo Lógico', description: 'Mestre em explicar conceitos complexos de forma clara e estruturada.' },
    { id: 'storytelling', name: 'Clara Narradora', description: 'Ajuda a transformar dados e fatos em histórias que cativam e emocionam.' },
    { id: 'standard', name: 'André Geral', description: 'Um coach versátil para feedback geral sobre comunicação.' }
];