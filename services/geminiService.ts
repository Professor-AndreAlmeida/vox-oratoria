import { Chat, GoogleGenAI, Type } from '@google/genai';
import { AnalysisReport, Session, GoalType, SkillDrillExercise, Challenge, NextStepSuggestion, AgentResponse, PracticeAttempt, AnalysisMode, ProactiveSuggestion, Persona, QAInteraction, QAPerformanceSummary, Milestone, User } from '../types';
import { getApiKey } from './apiKeyService';
import { getSelectedModel } from './modelService';

function getAiClient(): GoogleGenAI {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key do Google Gemini não configurada. Por favor, adicione-a na página de Configurações.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Helper to clean Markdown code fences from JSON strings before parsing.
 * This prevents crashes when the model returns ```json ... ``` wrappers.
 */
function cleanAndParseJSON<T>(text: string): T {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        console.error("Failed to parse JSON from AI response:", text);
        throw new Error("A IA retornou uma resposta em formato inválido. Tente novamente.");
    }
}

/**
 * Helper to convert a Blob to a Base64 string.
 */
async function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

const analysisReportSchema = {
    type: Type.OBJECT,
    properties: {
        clareza: { type: Type.OBJECT, properties: { nota: { type: Type.NUMBER }, justificativa: { type: Type.STRING } }, required: ["nota", "justificativa"] },
        palavrasPreenchimento: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { palavra: { type: Type.STRING }, contagem: { type: Type.NUMBER } }, required: ["palavra", "contagem"] } },
        ritmo: { type: Type.OBJECT, properties: { analise: { type: Type.STRING } }, required: ["analise"] },
        forca: { type: Type.OBJECT, properties: { frases_impactantes: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["frases_impactantes"] },
        textoOtimizado: { type: Type.STRING },
        wpm: { type: Type.OBJECT, properties: { valor: { type: Type.NUMBER }, analise: { type: Type.STRING } }, required: ["valor", "analise"] },
        entonação: { type: Type.OBJECT, properties: { variacao: { type: Type.NUMBER }, analise: { type: Type.STRING } }, required: ["variacao", "analise"] },
        pausas: { type: Type.OBJECT, properties: { contagem: { type: Type.NUMBER }, duracaoMedia: { type: Type.NUMBER }, qualidade: { type: Type.NUMBER }, pausasEstrategicas: { type: Type.ARRAY, items: { type: Type.STRING } }, analise: { type: Type.STRING } }, required: ["contagem", "duracaoMedia", "qualidade", "analise"] },
        estrutura: { 
            type: Type.OBJECT, 
            properties: {
                abertura: { type: Type.OBJECT, properties: { nota: { type: Type.NUMBER }, analise: { type: Type.STRING } }, required: ["nota", "analise"] },
                desenvolvimento: { type: Type.OBJECT, properties: { nota: { type: Type.NUMBER }, analise: { type: Type.STRING } }, required: ["nota", "analise"] },
                conclusao: { type: Type.OBJECT, properties: { nota: { type: Type.NUMBER }, analise: { type: Type.STRING } }, required: ["nota", "analise"] },
                comentarioGeral: { type: Type.STRING }
            },
            required: ["abertura", "desenvolvimento", "conclusao", "comentarioGeral"]
        },
        vocabularioETom: {
            type: Type.OBJECT,
            properties: {
                analiseTom: { type: Type.STRING },
                palavrasRepetidas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { palavra: { type: Type.STRING }, contagem: { type: Type.NUMBER } }, required: ["palavra", "contagem"] } },
                palavrasMuleta: { type: Type.ARRAY, items: { type: Type.STRING } },
                jargonSuggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, suggestion: { type: Type.STRING } }, required: ["term", "suggestion"] } }
            },
            required: ["analiseTom", "palavrasRepetidas", "palavrasMuleta"]
        },
        sentenceSentiments: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    sentence: { type: Type.STRING },
                    sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative', 'urgent'] },
                    score: { type: Type.NUMBER }
                },
                required: ["sentence", "sentiment", "score"]
            }
        },
        engagementHighlights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    engagementScore: { type: Type.NUMBER },
                    reason: { type: Type.STRING }
                },
                required: ["text", "engagementScore", "reason"]
            }
        },
        benchmarkAnalysis: {
            type: Type.OBJECT,
            properties: {
                archetype: { type: Type.STRING },
                wpmComparison: { type: Type.STRING },
                clarityComparison: { type: Type.STRING }
            },
            required: ["archetype", "wpmComparison", "clarityComparison"]
        },
        qaPerformanceSummary: {
            type: Type.OBJECT,
            properties: {
                assertiveness: { type: Type.NUMBER },
                dataUsage: { type: Type.NUMBER },
                generalFeedback: { type: Type.STRING }
            },
        },
        evolucao: {
            type: Type.OBJECT,
            properties: {
                comentarioGeral: { type: Type.STRING },
                tendenciaClareza: { type: Type.STRING, enum: ['melhorando', 'estagnado', 'piorando', 'insuficiente'] },
                tendenciaWPM: { type: Type.STRING, enum: ['acelerando', 'estabilizando', 'desacelerando', 'insuficiente'] },
            },
        },
        tomDeVoz: {
            type: Type.OBJECT,
            properties: {
                overallTone: { type: Type.STRING, description: "O tom geral da fala, ex: 'Confiante e Engajador'." },
                energyLevel: { type: Type.NUMBER, description: "Uma nota de 1 a 10 para o nível de energia." },
                emotionAnalysis: { type: Type.STRING, description: "Uma breve análise da emoção transmitida." },
                feedback: { type: Type.STRING, description: "Feedback acionável para melhorar a entrega vocal." }
            },
            required: ["overallTone", "energyLevel", "emotionAnalysis", "feedback"]
        },
    },
    required: ["clareza", "palavrasPreenchimento", "ritmo", "forca", "textoOtimizado", "wpm", "entonação", "pausas", "estrutura", "vocabularioETom", "sentenceSentiments", "engagementHighlights", "benchmarkAnalysis", "tomDeVoz"]
};

const getAnalysisPrompt = (
    transcript: string, 
    durationInSeconds: number, 
    analysisMode: AnalysisMode, 
    historicalSummary: any,
    coachStyle: User['coachStyle'],
    targetScript?: string, 
    qaInteractions?: QAInteraction[]
): string => {
    const wordCount = transcript.trim().split(/\s+/).length;
    const wpm = durationInSeconds > 0 ? (wordCount / durationInSeconds) * 60 : 0;

    let modeInstruction = "Faça uma análise geral de comunicação.";
    let archetype = "Apresentador Padrão";
    if (analysisMode === 'sales') {
        modeInstruction = "Foque em técnicas de persuasão, confiança e clareza para um pitch de vendas.";
        archetype = "Pitch de Vendas de Sucesso";
    }
    if (analysisMode === 'technical') {
        modeInstruction = "Foque na precisão, estrutura lógica e clareza da explicação de um tópico complexo.";
        archetype = "Palestra Técnica Eficaz";
    }
    if (analysisMode === 'storytelling') {
        modeInstruction = "Foque na capacidade de engajar, criar um arco narrativo e no impacto emocional.";
        archetype = "Discurso Inspirador (TED Talk)";
    }
    
    let qaSection = "";
    if (qaInteractions && qaInteractions.length > 0) {
        qaSection = `
        6.  **Resumo da Performance em Q&A:**
            - Baseado nas interações a seguir, forneça um resumo.
            - Interações: ${JSON.stringify(qaInteractions)}
            - Dê uma nota de 0 a 10 para 'assertiveness' (confiança e clareza nas respostas).
            - Dê uma nota de 0 a 10 para 'dataUsage' (uso de dados e evidências para suportar as respostas).
            - Forneça um 'generalFeedback' curto e acionável sobre a performance no Q&A.
        `;
    }

    let scriptComparison = "";
    if (targetScript) {
        scriptComparison = `O roteiro alvo era: "---${targetScript}---". Compare a transcrição com este roteiro, mas a análise principal deve ser sobre a performance da fala.`;
    }

    const historicalSection = `
        7. **Análise de Evolução Temporal ('evolucao'):**
           - Analise a tendência histórica do usuário fornecida abaixo.
           - Histórico (até 5 sessões anteriores): ${JSON.stringify(historicalSummary)}
           - Compare o desempenho atual (WPM: ${wpm.toFixed(0)}, Clareza: a ser calculada) com essa tendência.
           - Forneça um 'comentarioGeral' sobre a trajetória do usuário.
           - Determine 'tendenciaClareza' ('melhorando', 'estagnado', 'piorando') e 'tendenciaWPM' ('acelerando', 'estabilizando', 'desacelerando'). Se não houver dados históricos suficientes (menos de 2 sessões), use 'insuficiente'.
    `;

    const vocalToneSection = `
        8. **Análise de Tom de Voz ('tomDeVoz'):**
           - Com base na transcrição, no ritmo (WPM), na contagem de vícios e pausas, **INFERA** o tom de voz do orador.
           - Forneça um 'overallTone' (ex: "Confiante e Engajador", "Hesitante e Monótono").
           - Forneça um 'energyLevel' (um score de 1 a 10, onde 1 é muito baixo/sem energia e 10 é muito alto/energético).
           - Forneça uma 'emotionAnalysis' curta sobre a emoção transmitida (ex: "Transmite paixão pelo tópico", "Parece ansioso").
           - Forneça um 'feedback' acionável sobre como o orador pode melhorar sua entrega vocal para maior impacto.
    `;

    let systemInstruction = "Você é um coach de oratória de classe mundial, com especialidade em retórica e análise de discurso.";
    if (coachStyle === 'analytical') {
        systemInstruction = "Você é um coach de oratória analítico e direto. Foque em métricas, dados e fatos. Seja preciso e objetivo em seu feedback, priorizando a melhoria mensurável.";
    } else if (coachStyle === 'encouraging') {
        systemInstruction = "Você é um coach de oratória encorajador e motivacional. Foque nos pontos fortes e no progresso do usuário. Use uma linguagem positiva e de incentivo, celebrando as vitórias e sugerindo melhorias de forma construtiva.";
    } else if (coachStyle === 'technical') {
        systemInstruction = "Você é um coach de oratória técnico e detalhista. Foque em nuances da estrutura do discurso, vocabulário, figuras de linguagem e técnicas de retórica. Forneça um feedback aprofundado para usuários que buscam maestria.";
    }

    return `
      ${systemInstruction} Analise a seguinte transcrição.
      Duração da fala: ${Math.round(durationInSeconds)} segundos.
      Palavras por minuto (WPM) calculado: ${wpm.toFixed(0)}.

      Transcrição:
      ---
      ${transcript}
      ---

      ${scriptComparison}

      Siga estas instruções para sua análise aprofundada. Gere um relatório completo, preenchendo TODOS os campos solicitados, incluindo 'evolucao' e 'tomDeVoz':

      1.  **Análise de Performance:**
          - **Clareza:** Dê uma nota de 0 a 10 e uma justificativa curta.
          - **Vícios de Linguagem:** Identifique e conte palavras de preenchimento. Se não houver, retorne um array vazio.
          - **Ritmo e Fluidez:** Analise a cadência, o fluxo e a naturalidade da fala.
          - **Força e Impacto:** Extraia até 3 frases que foram particularmente fortes. Se não houver, retorne um array vazio.
          - **Texto Otimizado:** Reescreva a transcrição para ser mais clara, concisa e impactante.

      2.  **Análise Prosódica (Vocal):**
          - **WPM:** Analise o valor de ${wpm.toFixed(0)} PPM.
          - **Entonação:** Dê um score de 0 a 10 (0=monótono, 10=muito expressivo).
          - **Pausas:** Dê uma nota de 0-10 para a **qualidade** (eficácia) das pausas e identifique pausas estratégicas, se houver.

      3.  **Análise Estrutural e de Vocabulário:**
          - **Estrutura:** Avalie a **Abertura**, o **Desenvolvimento** e a **Conclusão**. Para cada parte, dê uma nota de 0 a 10 e uma análise curta, mais um comentário geral.
          - **Vocabulário e Tom:** Descreva o **tom**, identifique **palavras repetidas** e **palavras-muleta**. Adicionalmente, identifique **jargões ou termos complexos** e sugira alternativas mais simples ('jargonSuggestions'). Se não houver, retorne um array vazio.

      4.  **Análise Avançada (Novos Recursos):**
          - **Trajetória Emocional ('sentenceSentiments'):** Divida a transcrição em sentenças principais. Para cada uma, determine o sentimento ('positive', 'neutral', 'negative', 'urgent') e um score numérico (-1 a 1).
          - **Mapa de Calor de Engajamento ('engagementHighlights'):** Analise o **Texto Otimizado** que você gerou. Identifique até 3 frases com alto ou baixo potencial de engajamento. Para cada uma, forneça o texto, um 'engagementScore' (0 a 1, 1=alto engajamento) e uma 'reason' curta.
          - **Análise Comparativa ('benchmarkAnalysis'):** Compare a performance do usuário com o arquétipo de um "${archetype}". Forneça um 'wpmComparison' (ex: "10% mais rápido que a média para este tipo de discurso.") e um 'clarityComparison' (ex: "Clareza alinhada com o esperado para uma apresentação técnica.").

      5.  **Análise de Eventos Sincronizados ('events'):**
          - Identifique até 5 eventos notáveis na transcrição (vícios, frases confusas, frases fortes). Para cada um, forneça 'eventType', 'text' e uma 'suggestion'.
      
      ${qaSection}
      ${historicalSection}
      ${vocalToneSection}

      Foco da Análise: ${modeInstruction}

      Retorne APENAS um objeto JSON.
    `;
};

const formatDuration = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

// --- Fully Client-Side Gemini Services ---

/**
 * Transcribes audio blob directly using Gemini.
 * This acts as a robust fallback to ensure we have the complete text,
 * as the Live API streaming might cut off the end due to network latency.
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
        const ai = getAiClient();
        const base64Audio = await blobToBase64(audioBlob);
        
        // Dynamically get the MIME type from the blob (crucial for compatibility)
        // Browsers might record in 'audio/webm', 'audio/mp4', 'audio/ogg', etc.
        const mimeType = audioBlob.type || 'audio/webm';

        // Use Flash model for fast transcription
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType, 
                            data: base64Audio
                        }
                    },
                    {
                        text: "Transcreva o áudio a seguir integralmente, palavra por palavra. Não adicione comentários, não resuma, apenas o texto falado. Se houver silêncio ou áudio ininteligível, ignore."
                    }
                ]
            }
        });
        
        return response.text || "";
    } catch (error) {
        console.error("Error transcribing audio blob:", error);
        throw new Error("Falha ao transcrever o áudio final. Verifique se sua API Key é válida e se o formato de áudio é suportado.");
    }
}

export async function analyzeSession(
    transcription: string,
    audioBlob: Blob,
    durationInSeconds: number,
    analysisMode: AnalysisMode,
    allSessions: Session[],
    user: User,
    title?: string,
    targetScript?: string,
    qaInteractions?: QAInteraction[]
): Promise<Session> {
    const historicalSummary = allSessions.slice(0, 5).map(s => ({
        clareza: s.relatorio.clareza?.nota,
        wpm: s.relatorio.wpm?.valor,
        data: s.data,
    }));
    
    const prompt = getAnalysisPrompt(transcription, durationInSeconds, analysisMode, historicalSummary, user.coachStyle, targetScript, qaInteractions);
    
    // Retrieve the user-selected model
    const selectedModel = getSelectedModel();

    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: analysisReportSchema }
    });

    const analysisReport: AnalysisReport = cleanAndParseJSON(response.text);

    const newSession: Session = {
        id: crypto.randomUUID(),
        title: title || `Sessão de ${new Date().toLocaleDateString()}`,
        data: new Date().toISOString(),
        duracao: formatDuration(durationInSeconds),
        transcricao: transcription,
        relatorio: analysisReport,
        practiceAttempts: [],
        analysisMode,
        targetScript,
        audio_blob: audioBlob,
        isFavorite: false,
        qaInteractions
    };

    return newSession;
}

export async function analyzePracticeAttempt(
    transcription: string,
    audioBlob: Blob,
    durationInSeconds: number,
    originalSession: Session,
    allSessions: Session[],
    user: User
): Promise<PracticeAttempt> {
    const historicalSummary = allSessions.map(s => ({
        clareza: s.relatorio.clareza?.nota,
        wpm: s.relatorio.wpm?.valor,
        data: s.data,
    }));

    const prompt = getAnalysisPrompt(
        transcription,
        durationInSeconds,
        originalSession.analysisMode || 'standard',
        historicalSummary,
        user.coachStyle,
        originalSession.relatorio.textoOtimizado,
        originalSession.qaInteractions
    );

    const selectedModel = getSelectedModel();
    const ai = getAiClient();
    const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: { responseMimeType: 'application/json', responseSchema: analysisReportSchema }
    });
    
    const analysisReport: AnalysisReport = cleanAndParseJSON(response.text);

    const newAttempt: PracticeAttempt = {
        id: crypto.randomUUID(),
        data: new Date().toISOString(),
        duracao: formatDuration(durationInSeconds),
        transcricao: transcription,
        relatorio: analysisReport,
        audio_blob: audioBlob,
    };

    return newAttempt;
}

// --- Other client-side functions ---

export async function analyzeSkillDrillAttempt(
    goalType: GoalType,
    challenge: string,
    transcript: string
): Promise<{ success: boolean; feedback: string }> {
    const prompt = `
        Analise a tentativa do usuário de completar um exercício de oratória.
        - Objetivo do Treino: ${goalType}
        - Exercício (frase que deveria ser dita): "${challenge}"
        - Transcrição da fala do usuário: "${transcript}"
        
        Compare a transcrição com o exercício.
        Se o usuário teve sucesso (ex: não usou vícios de linguagem para o objetivo 'filler_words', ou falou a frase claramente para 'clarity'), retorne um objeto JSON com 'success: true' e um 'feedback' positivo e encorajador.
        Se o usuário falhou, retorne 'success: false' e um 'feedback' construtivo e curto sobre o que melhorar.
        Seja um coach amigável. Retorne APENAS o objeto JSON.
    `;

    try {
        const selectedModel = getSelectedModel();
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        success: { type: Type.BOOLEAN },
                        feedback: { type: Type.STRING }
                    },
                    required: ['success', 'feedback']
                }
            }
        });
        return cleanAndParseJSON(response.text);
    } catch (e) {
        console.error("Failed to parse skill drill analysis:", e);
        return { success: false, feedback: "Não foi possível analisar a sua tentativa. Tente novamente." };
    }
}

export async function startQASession(transcript: string, persona: Persona): Promise<Chat> {
    const systemInstruction = `Você é ${persona.name}, um(a) ${persona.description}. Sua tarefa é fazer perguntas desafiadoras e realistas sobre o seguinte discurso. Após cada resposta do usuário, você deve fornecer um feedback conciso e direto em UMA ÚNICA LINHA, seguido por uma quebra de linha (\\n), e então fazer a próxima pergunta. O feedback deve avaliar a qualidade da resposta. Faça no máximo 3 perguntas no total. Quando o usuário enviar a mensagem "Faça a primeira pergunta.", responda apenas com a primeira pergunta, sem nenhum texto adicional.`;
    
    const selectedModel = getSelectedModel();
    const ai = getAiClient();
    const chat = ai.chats.create({
        model: selectedModel,
        config: {
            systemInstruction
        },
        history: [{
            role: "user",
            parts: [{ text: `O discurso a ser analisado é: ---${transcript}---` }]
        },
        {
            role: "model",
            parts: [{ text: `Entendido. Estou pronto para iniciar a simulação como ${persona.name}. Aguardando o comando para fazer a primeira pergunta.` }]
        }]
    });
    return chat;
}

export async function sendAnswerToQASession(chat: Chat, answer: string): Promise<string> {
    const result = await chat.sendMessage({ message: answer });
    return result.text;
}

export async function generateSkillDrillExercise(goalType: GoalType): Promise<SkillDrillExercise[]> {
    const fallbackDrills: Record<GoalType, SkillDrillExercise[]> = {
        filler_words: [
            { type: 'filler_words', instruction: 'Leia a frase a seguir em voz alta, focando em fazer pausas naturais em vez de usar palavras de preenchimento.', challenge: 'O projeto... hum... parece promissor, sabe? Mas, tipo, precisamos de mais dados.' },
            { type: 'filler_words', instruction: 'Tente descrever seu café da manhã de hoje em uma frase completa, sem usar "então", "aí" ou "tipo".', challenge: 'Pense em como você descreveria seu café da manhã.' },
            { type: 'filler_words', instruction: 'Complete a frase a seguir com confiança, sem hesitar.', challenge: 'A principal vantagem da nossa abordagem é...' }
        ],
        clarity: [
            { type: 'clarity', instruction: 'Leia a frase complexa a seguir, tentando torná-la o mais clara e compreensível possível através da sua entonação.', challenge: 'A desintermediação sinérgica da nossa plataforma multifacetada alavanca paradigmas disruptivos.' },
            { type: 'clarity', instruction: 'Explique o conceito de "nuvem" (computação) como se fosse para uma criança de 10 anos.', challenge: 'A computação em nuvem é como...' },
            { type: 'clarity', instruction: 'Leia o trava-língua a seguir devagar e com a máxima clareza.', challenge: 'O rato roeu a roupa do rei de Roma.' }
        ],
        wpm: [
             { type: 'wpm', instruction: 'Leia o parágrafo a seguir em um ritmo constante e confiante, em cerca de 15 segundos.', challenge: 'A comunicação eficaz é uma das habilidades mais importantes no mundo profissional. Ela não se resume apenas a transmitir informações, mas a garantir que a mensagem seja recebida e compreendida da maneira correta.' },
             { type: 'wpm', instruction: 'Leia a frase a seguir de forma lenta e deliberada, como se estivesse enfatizando um ponto muito importante.', challenge: 'O futuro da nossa empresa depende desta decisão.' },
        ],
        intonation_variety: [
            { type: 'intonation_variety', instruction: 'Leia a frase a seguir, primeiro como uma afirmação e depois como uma pergunta surpresa.', challenge: 'Você terminou o relatório.' },
            { type: 'intonation_variety', instruction: 'Diga a frase a seguir com entusiasmo crescente.', challenge: 'Nós não apenas atingimos a meta, nós a superamos.' },
            { type: 'intonation_variety', instruction: 'Leia a frase a seguir com um tom sério e depois com um tom irônico.', challenge: 'Que ótima ideia.' }
        ]
    };
    return fallbackDrills[goalType] || [];
}

const challengeSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['sprint', 'mission', 'marathon'] },
        title: { type: Type.STRING },
        narrative: { type: Type.STRING },
        milestones: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    taskType: { type: Type.STRING, enum: ['skill_drill', 'record_session', 're_record_session'] },
                    target: { 
                        type: Type.STRING, 
                        description: "A condição de conclusão. Deve ser ESTRITAMENTE no formato 'METRICA OPERADOR VALOR' (sem aspas). Ex: 'clareza >= 8' ou 'vicios < 3'." 
                    },
                },
                required: ['description', 'taskType', 'target']
            }
        },
    },
    required: ["type", "title", "narrative", "milestones"]
};

export async function generateChallenge(sessions: Session[], challenges: Challenge[]): Promise<Challenge> {
    const ai = getAiClient();
    const sessionSummary = sessions.slice(0, 5).map(s => {
        if (s.analysisMode === 'copilot') {
            const fillerWordCount = s.relatorio.palavrasPreenchimento?.reduce((sum, fw) => sum + fw.contagem, 0) || 0;
            return `- Em uma Sessão de Campo (Co-piloto), o usuário falou por ${s.duracao} com ${fillerWordCount} vícios e um ritmo médio de ${s.relatorio.wpm?.valor.toFixed(0)} PPM.`;
        }
        const fillerWordCount = s.relatorio.palavrasPreenchimento?.reduce((sum, fw) => sum + fw.contagem, 0) || 0;
        return `- Sessão de Prática "${s.title}": Clareza ${s.relatorio.clareza?.nota}/10, ${fillerWordCount} vícios, WPM ${s.relatorio.wpm?.valor.toFixed(0)}.`;
    }).join('\n');
    
    const challengeHistory = challenges.filter(c => c.status !== 'suggested').slice(0, 3).map(c => `- Desafio "${c.title}" foi ${c.status}.`).join('\n');

    const prompt = `
        Você é o "Agente de Carreira vOx", um coach de IA que cria desafios personalizados.
        Baseado no histórico recente do usuário, crie um novo desafio.

        Histórico de Sessões:
        ${sessionSummary || "Nenhuma sessão ainda."}

        Histórico de Desafios:
        ${challengeHistory || "Nenhum desafio anterior."}

        Instruções:
        1.  Analise as fraquezas recorrentes (ex: baixa clareza, muitos vícios de linguagem, WPM inconsistente).
        2.  Crie um desafio do tipo 'mission' ou 'sprint' com um título ('title') e uma narrativa ('narrative') motivadores.
        3.  Defina 2 marcos ('milestones') acionáveis. Cada marco deve ter:
            - 'description': O que o usuário deve fazer.
            - 'taskType': 'skill_drill' (exercício rápido) ou 'record_session' (gravar uma sessão completa).
            - 'target': **ATENÇÃO:** O target deve ser uma string técnica simples.
                - Use 'clareza', 'vicios', 'wpm' ou 'entonacao'.
                - Use operadores '>', '>=', '<', '<='.
                - Exemplo OBRIGATÓRIO: "clareza >= 8" ou "vicios < 3".
                - **NÃO use frases longas**. Apenas "METRICA OPERADOR VALOR".
        4.  Seja criativo e encorajador na narrativa.

        Retorne APENAS o objeto JSON.
    `;

    const selectedModel = getSelectedModel();
    const response = await ai.models.generateContent({
        model: selectedModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: challengeSchema
        }
    });

    const challengeData = cleanAndParseJSON<Omit<Challenge, 'id' | 'status'>>(response.text);

    return {
        id: crypto.randomUUID(),
        ...challengeData,
        status: 'suggested',
        milestones: challengeData.milestones.map((m: any) => ({ ...m, status: 'pending' })),
    };
}


const nextStepSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['skill_drill', 'qa_simulation'] },
        reason: { type: Type.STRING },
        context: {
            type: Type.OBJECT,
            properties: {
                goalType: { type: Type.STRING, enum: ['clarity', 'filler_words', 'intonation_variety', 'wpm'] },
                personaId: { type: Type.STRING, enum: ['investor', 'client', 'journalist'] },
            }
        }
    },
    required: ["type", "reason", "context"]
};

export async function generateNextStepSuggestion(session: Session): Promise<NextStepSuggestion | null> {
    const ai = getAiClient();
    const weaknesses: string[] = [];
    
    // Check existing metrics
    if (session.relatorio.clareza && session.relatorio.clareza.nota < 7) weaknesses.push(`clareza (nota ${session.relatorio.clareza.nota})`);
    if (session.relatorio.palavrasPreenchimento && session.relatorio.palavrasPreenchimento.reduce((sum, fw) => sum + fw.contagem, 0) > 5) weaknesses.push('vícios de linguagem');
    if (session.relatorio.entonação && session.relatorio.entonação.variacao < 4) weaknesses.push('variação de entonação');
    
    // Check WPM (Rhythm)
    if (session.relatorio.wpm) {
        if (session.relatorio.wpm.valor < 110) weaknesses.push('ritmo muito lento');
        if (session.relatorio.wpm.valor > 160) weaknesses.push('ritmo muito acelerado');
    }

    if (weaknesses.length === 0) return null; // No obvious weakness, no suggestion.

    const prompt = `
        Você é o "Agente de Continuidade vOx". Baseado no relatório desta sessão, sugira o próximo passo mais lógico para o usuário.
        
        Relatório da Sessão:
        - Título: ${session.title}
        - Modo de Análise: ${session.analysisMode}
        - Pontos Fracos Identificados: ${weaknesses.join(', ')}

        Instruções:
        1.  Escolha UMA ação: 'skill_drill' para uma fraqueza mecânica (clareza, vícios, ritmo, entonação) ou 'qa_simulation' se o conteúdo era complexo (vendas, técnico) mas a execução foi boa.
        2.  Escreva uma 'reason' curta e clara explicando o porquê da sua sugestão.
        3.  Preencha o 'context':
            - Se 'skill_drill', defina 'goalType' para a principal fraqueza (clarity, filler_words, wpm, intonation_variety).
            - Se 'qa_simulation', defina 'personaId' relevante para o modo de análise.
        
        Retorne APENAS o objeto JSON.
    `;

    try {
        const selectedModel = getSelectedModel();
        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: nextStepSuggestionSchema
            }
        });
        return cleanAndParseJSON(response.text);
    } catch (error) {
        console.error("Error generating next step suggestion:", error);
        return null;
    }
}

export async function generateSuggestionFromQA(interactions: QAInteraction[], analysisMode: AnalysisMode): Promise<NextStepSuggestion | null> {
    const prompt = `
        Você é o "Agente de Continuidade vOx". Analise as seguintes interações de Perguntas e Respostas (Q&A).
        O objetivo do usuário era uma simulação de ${analysisMode}.
        
        Interações:
        ${JSON.stringify(interactions, null, 2)}

        Instruções:
        1. Avalie a performance geral do usuário. Ele foi assertivo? Usou dados? Foi claro?
        2. Se você identificar UMA fraqueza clara e acionável (ex: respostas vagas, falta de confiança, dificuldade com objeções), sugira um 'skill_drill' para ajudar a melhorar.
        3. A fraqueza deve ser algo que pode ser treinado com um exercício rápido (clareza, vícios de linguagem, etc.).
        4. Se a performance foi boa ou se não há uma fraqueza óbvia para um 'skill_drill', retorne a palavra 'null' sem aspas.
        5. Escreva uma 'reason' curta explicando o porquê da sua sugestão.
        6. Preencha o 'contexto' com o 'goalType' apropriado.

        Retorne APENAS um objeto JSON com o schema de NextStepSuggestion ou a palavra 'null'.
    `;
    const selectedModel = getSelectedModel();
    const ai = getAiClient();
    try {
        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: nextStepSuggestionSchema
            }
        });

        // The text property exists, but might contain markdown. Clean it.
        const text = response.text.trim();
        if (text.toLowerCase() === 'null') return null;
        
        return cleanAndParseJSON(text) as NextStepSuggestion;
    } catch (e) {
        console.error("Failed to parse suggestion from QA:", e);
        return null;
    }
}

export async function generateWeeklySummary(sessions: Session[]): Promise<string> {
    const summaryData = sessions.map(s => ({
        date: s.data,
        mode: s.analysisMode,
        clarity: s.relatorio.clareza?.nota,
        fillerWords: s.relatorio.palavrasPreenchimento?.reduce((sum, fw) => sum + fw.contagem, 0) || 0,
        wpm: s.relatorio.wpm?.valor
    }));

    const prompt = `
        Você é o "Agente de Performance vOx", um coach de IA que analisa o progresso semanal de um usuário.
        Baseado no resumo de sessões da última semana, gere um "Sumário Executivo" em formato Markdown.

        Dados das Sessões da Semana:
        ${JSON.stringify(summaryData, null, 2)}

        Instruções:
        1.  **Título:** Comece com "### Seu Resumo da Semana".
        2.  **Análise Geral:** Escreva um parágrafo curto sobre a atividade da semana.
        3.  **Maiores Vitórias:** Crie uma seção "🏆 Maiores Vitórias". Liste 1 ou 2 melhorias notáveis (ex: "Sua nota de clareza média subiu de 6 para 8!"). Seja específico e use os dados.
        4.  **Ponto de Foco:** Crie uma seção "🎯 Foco para a Próxima Semana". Identifique a principal área para melhoria com base nos dados e dê uma dica acionável.
        5.  **Mensagem Motivacional:** Termine com uma frase curta e encorajadora.

        Seja conciso, positivo e orientado a dados.
    `;
    const ai = getAiClient();
    // Usually uses flash for quick summaries
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
}


const agentResponseSchema = {
    type: Type.OBJECT,
    properties: {
        response_text: { type: Type.STRING },
        navigation_action: {
            type: Type.OBJECT,
            properties: {
                button_label: { type: Type.STRING },
                target_page: { type: Type.STRING, enum: ['dashboard', 'new_session', 'history', 'journey', 'settings', 'tutorial'] }
            },
            propertyOrdering: ["button_label", "target_page"]
        }
    },
    required: ["response_text"]
};

export async function getHelpFromVoxAgent(userQuestion: string): Promise<AgentResponse> {
    const ai = getAiClient();
    const systemInstruction = `
        Você é o "Guia vOx", um assistente de IA especialista na plataforma vOx Oratória.
        Sua missão é ajudar os usuários a navegar, entender e tirar o máximo proveito da plataforma.

        **Sobre o vOx Oratória (Versão 3.0):**
        - É uma plataforma Open Source e Local-First.
        - **Privacidade Total:** Todos os dados (áudios, textos, chaves) ficam salvos APENAS no navegador (IndexedDB). Nada vai para a nuvem.
        - **Custo Zero:** O usuário usa sua própria API Key do Google Gemini (BYOK).

        **Funcionalidades Principais:**
        1.  **Painel (Dashboard):** Visão geral, desafios ativos e resumo semanal.
        2.  **Nova Sessão:** Onde se inicia a gravação. Possui "Tecnologia Híbrida" (Live API para preview + Blob para análise fiel).
        3.  **Configurações (IMPORTANTE):**
            - **API Key:** Onde se insere a chave.
            - **Modelo de IA:** O usuário pode escolher entre **Flash** (Rápido/Grátis) ou **Pro** (Inteligente/Pago).
            - **Backup:** O usuário deve exportar dados manualmente para não perdê-los ao limpar cache.
        4.  **Jornada & Gamificação:** O "Agente de Carreira" cria desafios automaticamente baseado no histórico. Não há criação manual de metas.
        5.  **Estúdio de Ensaio (Pulpit Mode):** Teleprompter com Co-piloto de IA.
        6.  **Simulação de Q&A:** Prática com personas (Investidor, Cliente).

        **Respostas Comuns:**
        - "Meu áudio cortou?": Não corta mais. Usamos gravação híbrida que garante 100% da fala.
        - "Como crio uma meta?": Você não cria. Pratique, e o Agente de Carreira analisará seu histórico e criará um Desafio personalizado automaticamente na aba Jornada.
        - "Qual modelo usar?": Use Flash para velocidade. Use Pro para análises mais profundas e Q&A complexo.
        - "Login/Senha?": Não existe. Apenas seu nome localmente.

        **Ações de Navegação Disponíveis:**
        - 'dashboard', 'new_session', 'history', 'journey', 'settings', 'tutorial'.

        Seja conciso, amigável e direto. Responda em Markdown simples.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Pergunta do usuário: "${userQuestion}"`,
        config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: agentResponseSchema
        }
    });

    return cleanAndParseJSON(response.text);
}


export async function generatePulpitTextStream(prompt: string, systemInstruction: string): Promise<AsyncGenerator<any>> {
    const ai = getAiClient();
    const selectedModel = getSelectedModel();
    return ai.models.generateContentStream({
        model: selectedModel,
        contents: prompt,
        config: { systemInstruction }
    });
}

export async function generatePulpitImage(prompt: string): Promise<string> {
    const ai = getAiClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
        },
    });
    return response.generatedImages[0].image.imageBytes;
}

const proactiveSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        originalText: { type: Type.STRING },
        suggestionType: { type: Type.STRING, enum: ['DATA_POINT', 'AUDIENCE_QUESTION', 'REPHRASE', 'IMAGE_IDEA', 'SIMPLIFY'] },
        suggestionTitle: { type: Type.STRING },
        promptForNextStep: { type: Type.STRING },
    },
    required: ["originalText", "suggestionType", "suggestionTitle", "promptForNextStep"]
};

export async function generateProactiveSuggestions(
    script: string,
    styleProfile?: string
): Promise<ProactiveSuggestion[]> {
    if (!script.trim() || script.trim().split(/\s+/).length < 20) {
        return [];
    }

    const ai = getAiClient();

    const systemInstruction = `You are a world-class speechwriting co-pilot. Analyze the user's script and identify specific sentences or phrases that could be improved.
    Your goal is to provide proactive, actionable suggestions. For each suggestion, you MUST identify the exact original text to highlight.
    ${styleProfile ? `The user's communication style is: "${styleProfile}". Tailor your suggestions to this style.` : ''}
    
    You should look for opportunities like:
    - REPHRASE: Complex sentences that can be made clearer or more impactful.
    - SIMPLIFY: Jargon or overly technical language that could be simplified for a broader audience.
    - DATA_POINT: Claims that could be strengthened with a statistic or data point.
    - AUDIENCE_QUESTION: Statements that could be turned into engaging questions for the audience.
    - IMAGE_IDEA: Descriptions that could be enhanced with a visual aid.

    For each suggestion, provide:
    1.  'originalText': The EXACT text from the script to be highlighted. It must be a substring of the input script.
    2.  'suggestionType': One of the types listed above.
    3.  'suggestionTitle': A very short, user-facing title for the suggestion (e.g., "Simplify this phrase", "Add a statistic").
    4.  'promptForNextStep': The EXACT, complete prompt that SHOULD BE SENT TO ANOTHER AI if the user accepts your suggestion. This prompt should ask the AI to perform the specific action (e.g., "Rewrite the following sentence to be more concise: '[original text here]'").
    
    Return an array of up to 5 suggestions. If you find no good suggestions, return an empty array.
    `;

    const prompt = `Here is the user's script:\n\n---\n${script}\n---`;
    
    // Proactive suggestions benefit from higher intelligence models (Pro)
    const selectedModel = getSelectedModel(); 
    
    try {
        const response = await ai.models.generateContent({
            model: selectedModel,
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: proactiveSuggestionSchema
                }
            }
        });

        const suggestions: ProactiveSuggestion[] = cleanAndParseJSON(response.text);
        return suggestions.filter(s => script.includes(s.originalText));

    } catch (error) {
        console.error("Error generating proactive suggestions:", error);
        return [];
    }
}