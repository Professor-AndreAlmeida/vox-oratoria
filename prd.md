# PRD: Documento de Requisitos do Produto - vOx Oratória (Open Source)

**Versão:** 3.0 (Versão de Lançamento)
**Data:** 27 de Outubro de 2024
**Autor:** Professor André Almeida & Equipe de Engenharia Open Source

## 1. Visão Geral do Produto

O **vOx Oratória** é uma aplicação web **Open Source** e **Local-First**, projetada para democratizar o acesso ao treinamento de comunicação de alta qualidade. A plataforma atua como um coach pessoal que utiliza a API do Google Gemini para oferecer feedback instantâneo sobre oratória.

**Filosofia Central:**
1.  **Privacidade Absoluta:** Todos os dados (áudios, textos, chaves de API, histórico) vivem exclusivamente no navegador do usuário (IndexedDB). Nada é enviado para servidores proprietários.
2.  **Custo Zero de Plataforma:** O software é gratuito. O usuário utiliza sua própria cota gratuita (ou paga) da API do Google Gemini (Modelo BYOK - Bring Your Own Key).
3.  **Simplicidade:** Sem senhas, sem cadastros complexos. Apenas um nome para identificação local.

---

## 2. Recursos da Plataforma (Implementados)

### 2.1. Acesso e Identidade (`Local Auth`)
Sistema de autenticação simulada para UX, sem backend.
- **Tela de Boas-Vindas:** Substitui o login tradicional. Solicita apenas o **Nome/Apelido** do usuário.
- **Persistência:** O estado do usuário é salvo no `localStorage`, permitindo reconexão automática sem senha.
- **Botão Sair:** Limpa a sessão da memória, mas preserva os dados no banco de dados local.

### 2.2. Painel (Dashboard)
O centro de comando da evolução do usuário.
- **Status da API Key:** Card de alerta proativo que verifica se a chave do Gemini está configurada.
- **Desafio Ativo:** Exibe a missão atual gerada pelo "Agente de Carreira" (ex: "Sprint de Clareza"), se houver.
- **Ações Rápidas:**
  - **Praticar:** Inicia o fluxo de nova sessão.
  - **Gerar Resumo Semanal:** Aciona a IA para ler o histórico dos últimos 7 dias e gerar um relatório executivo em Markdown.
- **Sessões Recentes:** Lista as últimas 3 práticas para acesso rápido.

### 2.3. Configuração de Sessão (`NewSessionSetup`)
Interface para definir o contexto do treino.
- **Tópico:** Título ou tema da apresentação (ex: "Pitch de Vendas").
- **Modo de Entrada:**
  - **Com Roteiro:** Usuário cola um texto base (ativa o Teleprompter).
  - **Livre (Freestyle):** Improvisação total.
- **Foco da Análise (Personas do Coach):**
  - **Padrão:** Generalista.
  - **Vendas:** Persuasão e fechamento.
  - **Técnico:** Precisão e lógica.
  - **Storytelling:** Narrativa e emoção.

### 2.4. Gravador Híbrido (`Recorder`)
Sistema robusto de captura de áudio com dupla verificação.
- **Tecnologia:**
  1.  **Gemini Live API (WebSockets):** Para transcrição em tempo real na tela (feedback visual).
  2.  **MediaRecorder (Blob):** Gravação de alta fidelidade em paralelo.
- **Fluxo de Análise:** Ao finalizar, o sistema envia o **Blob de áudio completo** para a IA transcrever novamente, garantindo que nenhuma palavra seja cortada por latência de rede (correção de Race Condition).
- **Teleprompter Automático:** Se houver roteiro, o texto rola automaticamente baseado em um cálculo de WPM estimado.
- **Travas de Segurança:** Impede envio de áudios com menos de 3 segundos.

### 2.5. Relatório de Análise (`AnalysisReportComponent`)
Diagnóstico profundo gerado localmente.
- **Métricas Quantitativas:**
  - Nota de Clareza (0-10) com gauge visual.
  - Ritmo (Palavras por Minuto - PPM) com faixas ideais.
  - Contagem de Vícios de Linguagem (Gráfico de barras).
  - Variação de Entonação e Qualidade das Pausas.
- **Análise Estrutural:** Avaliação segmentada de Abertura, Desenvolvimento e Conclusão.
- **Análise Comportamental:** Tom de voz (Energia, Emoção) e Mapa de Calor de Sentimentos.
- **Texto Otimizado:** Versão reescrita do discurso pela IA.
- **Agente de Continuidade:** Sugere o próximo passo lógico (ex: "Iniciar Treino de Ritmo" ou "Simulação Q&A") baseado nas fraquezas detectadas.

### 2.6. Estúdio de Ensaio (`PulpitMode`)
Ambiente de refinamento de texto e treino.
- **Modo Ensaio:** Editor de texto onde o usuário pode solicitar análise do **Co-piloto de IA** sob demanda (para economizar tokens).
- **Ferramentas de IA:** Geração de Dados de Impacto, Perguntas para Audiência e Imagens Conceituais (via Imagen 3).
- **Modo Púlpito:** Interface limpa de teleprompter para leitura final.
- **Gravação Interna:** Permite gravar ensaios do texto refinado e baixar o áudio.

### 2.7. Simulação de Q&A (`QASimulation`)
Simulador de banca examinadora.
- **Personas:** Investidor, Cliente, Jornalista ou **Persona Personalizada** (criada pelo usuário).
- **Interação:** A IA gera perguntas baseadas na transcrição da sessão. O usuário grava a resposta e recebe feedback imediato.
- **Histórico:** As interações são salvas em uma linha do tempo dentro do relatório da sessão.

### 2.8. Jornada & Gamificação (`GamificationContext`)
Sistema de engajamento automático.
- **Agente de Carreira:** Analisa o histórico de sessões e gera **Desafios** ("Missões") personalizados.
- **Skill Drills (Ginásio):** Exercícios rápidos (ex: trava-línguas, leitura de ritmo) gerados pela IA para corrigir falhas específicas.
- **Validação Automática:** O sistema verifica automaticamente se uma nova sessão cumpre os requisitos do desafio ativo (ex: "Clareza > 8").
- **Cronoscópio:** Gráfico de tendência de evolução (Clareza, Vícios, WPM).
- *Nota:* O sistema manual de "Metas" foi removido em favor desta abordagem automatizada.

### 2.9. Configurações (`SettingsPage`)
Área administrativa.
- **Gestão de API Key:** Campo seguro para inserir a chave do Gemini.
- **Seleção de Modelo de IA:**
  - **Gemini 2.5 Flash:** Padrão (Rápido/Gratuito).
  - **Gemini 3.0 Pro:** Opcional (Raciocínio Avançado/Custo maior).
- **Backup de Dados:**
  - **Exportar:** Gera arquivo JSON completo.
  - **Importar:** Restaura backup.
  - **Zona de Perigo:** Factory Reset (Limpa IndexedDB).

### 2.10. Guia vOx (`ChatWidget`)
- Assistente de IA flutuante que responde dúvidas sobre o funcionamento da plataforma e navega o usuário para as telas corretas.

---

## 3. Especificações Técnicas

### 3.1. Stack Tecnológica
- **Frontend:** React 19, TypeScript, TailwindCSS.
- **Build Tool:** Vite (Migrado de ImportMaps para performance e suporte a módulos).
- **Database:** IndexedDB (via biblioteca `idb`) - Banco de dados no navegador.
- **IA Integration:** SDK `@google/genai` v1.30+.

### 3.2. Modelos de IA Utilizados
- **Transcrição Rápida (Live):** `gemini-2.5-flash-native-audio-preview-09-2025`.
- **Transcrição Fiel (Recorder):** `gemini-2.5-flash` (Processamento de Blob).
- **Cérebro (Análise/Chat):** Selecionável (`gemini-2.5-flash` ou `gemini-3-pro-preview`).
- **Imagem (Púlpito):** `imagen-4.0-generate-001`.

---

## 4. Próximos Passos (Roadmap Pós-Lançamento)

1.  **PWA (Progressive Web App):** Configurar manifesto e service workers para instalação no Desktop/Mobile.
2.  **Internacionalização (i18n):** Suporte para Inglês e Espanhol.
3.  **Acessibilidade:** Melhorar suporte a leitores de tela (ARIA) em componentes complexos como o Gráfico.

---

**Licença:** MIT
**Status:** Pronto para Produção (MVP)
