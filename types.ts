export interface ClarityReport {
  nota: number;
  justificativa: string;
}

export interface FillerWord {
  palavra: string;
  contagem: number;
}

export interface RhythmReport {
  analise: string;
}

export interface StrengthReport {
  frases_impactantes: string[];
}

export interface ComparisonReport {
  melhoraClareza: number;
  reducaoVicios: number;
  comentarioGeral: string;
}

// --- Novas interfaces para Análise Prosódica ---
export interface WPMReport {
  valor: number; // Palavras por minuto
  analise: string;
}

export interface PitchReport {
  variacao: number; // Um score/desvio padrão que representa a variação
  analise: string;
}

export interface PausesReport {
  contagem: number;
  duracaoMedia: number; // em segundos
  qualidade: number; // Novo: score de 0 a 10 para eficácia
  pausasEstrategicas?: string[]; // Novo: exemplos de pausas bem usadas
  analise: string;
}
// ---------------------------------------------

// --- Novas interfaces para Análise de Conteúdo e Estrutura ---
export interface StructureSectionReport {
    nota: number; // 0 a 10
    analise: string;
}

export interface StructureReport {
    abertura: StructureSectionReport;
    desenvolvimento: StructureSectionReport;
    conclusao: StructureSectionReport;
    comentarioGeral: string;
}

export interface JargonSuggestion {
    term: string;
    suggestion: string;
}

export interface VocabularyAndToneReport {
    analiseTom: string;
    palavrasRepetidas: FillerWord[]; // Reutilizando a interface
    palavrasMuleta: string[]; // Ex: "na minha opinião", "basicamente"
    jargonSuggestions?: JargonSuggestion[];
}
// -----------------------------------------------------------

// --- Novas interfaces para as 5 melhorias ---
export interface SentenceSentiment {
    sentence: string;
    sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
    score: number; // ex: de -1 a 1
}

export interface EngagementHighlight {
    text: string;
    engagementScore: number; // ex: de 0 a 1 (baixo a alto)
    reason: string;
}

export interface BenchmarkAnalysis {
    archetype: string;
    wpmComparison: string;
    clarityComparison: string;
}

export interface QAPerformanceSummary {
    assertiveness: number; // 0 a 10
    dataUsage: number; // 0 a 10
    generalFeedback: string;
}

// --- Nova interface para Análise Temporal ---
export interface EvolucaoReport {
    comentarioGeral: string;
    tendenciaClareza: 'melhorando' | 'estagnado' | 'piorando' | 'insuficiente';
    tendenciaWPM: 'acelerando' | 'estabilizando' | 'desacelerando' | 'insuficiente';
}
// ---------------------------------------------

// --- Nova interface para Análise de Tom de Voz ---
export interface VocalToneReport {
    overallTone: string; // ex: "Confiante e Engajador", "Hesitante e Monótono"
    energyLevel: number; // 1-10
    emotionAnalysis: string;
    feedback: string;
}
// ---------------------------------------------


export interface AnalysisReport {
  clareza: ClarityReport;
  palavrasPreenchimento: FillerWord[];
  ritmo: RhythmReport;
  forca: StrengthReport;
  textoOtimizado: string;
  comparativo?: ComparisonReport;
  // Campos de análise prosódica
  wpm: WPMReport;
  entonação: PitchReport;
  pausas: PausesReport;
  // Novos campos de análise aprofundada
  estrutura?: StructureReport;
  vocabularioETom?: VocabularyAndToneReport;
  // Novo campo para análise sincronizada
  events?: {
    eventType: string;
    text: string;
    suggestion: string;
  }[];
  // Campos para as 5 melhorias
  sentenceSentiments?: SentenceSentiment[];
  engagementHighlights?: EngagementHighlight[];
  benchmarkAnalysis?: BenchmarkAnalysis;
  qaPerformanceSummary?: QAPerformanceSummary;
  // Novo campo para análise temporal
  evolucao?: EvolucaoReport;
  // Novo campo para análise de tom de voz
  tomDeVoz?: VocalToneReport;
}

export interface PracticeAttempt {
  id: string; // Changed from number to string for UUID
  data: string;
  duracao: string;
  transcricao: string;
  relatorio: AnalysisReport; // Contains the 'comparativo' part against the previous attempt
  audio_url?: string;
  audio_blob?: Blob;
}

export interface Coach {
  id: string;
  name: string;
  description: string;
}

// --- Novas interfaces para Simulação de Q&A ---
export interface Persona {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
}

export interface QAInteraction {
  persona: string; // The name of the persona
  question: string;
  userAnswer: string;
  feedback: string;
}

// Nova interface para agrupar uma sessão de Q&A completa
export interface QASession {
    id: string;
    timestamp: string;
    persona: Persona;
    interactions: QAInteraction[];
}
// ------------------------------------------

export type AnalysisMode = 'standard' | 'sales' | 'technical' | 'storytelling' | 'copilot';

export interface Session {
  id: string; // Changed from number to string for UUID
  title?: string;
  data: string;
  duracao: string;
  transcricao: string;
  relatorio: Partial<AnalysisReport>;
  practiceAttempts: PracticeAttempt[];
  coachId?: string;
  targetScript?: string;
  isFavorite?: boolean;
  qaInteractions?: QAInteraction[]; // Mantido para compatibilidade, mas o uso principal será qaSessions
  qaSessions?: QASession[]; // Novo campo para histórico
  analysisMode?: AnalysisMode;
  audio_url?: string; // This is a transient property created from the blob for playback
  audio_blob?: Blob;
}

// Types for the "Improvement Journey" feature
// FIX: Add 'intonation_variety' as a valid GoalType to resolve type errors in multiple components.
export type GoalType = 'clarity' | 'filler_words' | 'wpm' | 'intonation_variety';

// Type for the Waveform Player
export interface PlaybackInfo {
    isPlaying: boolean;
    progress: number; // 0 to 1
    currentTime: string;
    totalTime: string;
}

// Type for User Authentication
export interface User {
  id: string;
  name: string;
  email: string;
  styleProfile?: string;
  profilePictureUrl?: string;
  coachStyle?: 'analytical' | 'encouraging' | 'technical';
}

// Type for Pulpit Mode Proactive AI
export type SuggestionType = 'DATA_POINT' | 'AUDIENCE_QUESTION' | 'REPHRASE' | 'IMAGE_IDEA' | 'SIMPLIFY';

export interface ProactiveSuggestion {
    originalText: string;
    suggestionType: SuggestionType;
    suggestionTitle: string; // User-facing title for the button/action
    promptForNextStep: string; // The exact prompt to use if the user accepts the suggestion
}

// Type for Skill Drills
export interface SkillDrillExercise {
  type: GoalType;
  instruction: string; // e.g., "Leia a frase a seguir em voz alta sem usar vícios de linguagem."
  challenge: string; // e.g., "O projeto... hum... parece promissor, sabe?"
}

// --- New Types for Proactive Gamification ---
export type ChallengeType = 'sprint' | 'mission' | 'marathon';
export type ChallengeStatus = 'suggested' | 'active' | 'completed' | 'declined';

export type MilestoneTaskType = 'skill_drill' | 'record_session' | 're_record_session';

export interface Milestone {
  description: string;
  taskType: MilestoneTaskType;
  target: string;
  status: 'pending' | 'completed';
}

export interface Challenge {
  id: string; // Changed from number to string for UUID
  type: ChallengeType;
  title: string;
  narrative: string;
  status: ChallengeStatus;
  milestones: Milestone[];
  reward?: string; // Made optional as we are removing the reward system
  startDate?: string;
  completedDate?: string;
}

// --- Type for Intent Prediction Agent ---
export type PreGeneratedDrills = {
    [key in GoalType]?: SkillDrillExercise[];
};

// --- Type for Session Continuity Agent ---
export type NextStepSuggestion = {
  type: 'skill_drill' | 'qa_simulation';
  reason: string;
  context: {
    goalType?: GoalType;
    personaId?: string; // e.g., 'investor', 'client'
  };
};

// --- Type for Agent Synergy ---
export interface SuggestionHistoryItem {
  sessionId: string; // Changed from number to string
  suggestion: NextStepSuggestion;
  date: string;
}

// --- Type for vOx Help Agent ---
export interface AgentResponse {
  response_text: string;
  navigation_action: {
    button_label: string;
    target_page: 'dashboard' | 'new_session' | 'history' | 'journey' | 'settings' | 'tutorial';
  } | null;
}

// --- New Type for Usage Tracking ---
export interface UsageStats {
  totalMinutes: number;
  estimatedCost: number;
}

// FIX: Moved AnalysisProgressStep to types.ts to be shared across components.
// FIX: Added 'Transcrevendo áudio...' as a valid step.
export type AnalysisProgressStep = 'Enviando para análise...' | 'IA está analisando...'
// FIX: Add missing types for CopilotWidget.
// --- New Types for Copilot Widget ---
export type CopilotState = 'setting_up' | 'listening' | 'error';

export interface AnchorKeyword {
  id: number;
  text: string;
  spoken: boolean;
}

// --- New Types for TrendChart ---
export type TrendMetric = 'clarity' | 'filler_words' | 'wpm';

// --- New Types for AI Model Selection ---
export type AiModelId = 'gemini-2.5-flash' | 'gemini-3-pro-preview';

export interface AiModelConfig {
    id: AiModelId;
    name: string;
    description: string;
    costEstimate: string; // Human readable cost estimate (e.g. "Free Tier" or "High Cost")
}