// NOTA: Estes dados são estáticos e servem como um fallback para a UI enquanto a busca completa de dados
// do backend não está implementada em todos os componentes. A lógica de IA (prompts) já utiliza o backend.
import { Persona } from './types';

export const personas: Persona[] = [
  { id: 'investor', name: 'Investidor Cético', description: 'Focado em ROI, métricas e riscos. Fará perguntas diretas e desafiadoras sobre o modelo de negócios.', isCustom: false },
  { id: 'client', name: 'Cliente Potencial', description: 'Interessado em como a solução resolve seu problema. Focado em benefícios, implementação e custo.', isCustom: false },
  { id: 'journalist', name: 'Jornalista Investigativo', description: 'Busca furos na história, inconsistências e o "grande porquê". Cético e detalhista.', isCustom: false },
];
