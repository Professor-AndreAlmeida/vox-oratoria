# vOx Oratória (VoxLabs) 🎙️

> **Seu Coach de Comunicação Pessoal, Privado e Open Source.**

O **vOx** é uma aplicação web de ponta que utiliza Inteligência Artificial (Google Gemini) para analisar sua oratória, fornecer feedback instantâneo sobre clareza, ritmo e vícios de linguagem, e guiar sua evolução profissional.

**Destaques:**
- 🔒 **Local-First:** Seus áudios e dados nunca saem do seu navegador (salvos no IndexedDB).
- 💸 **Totalmente Gratuito:** Sem assinaturas. Use sua própria API Key do Google Gemini (que possui um nível gratuito generoso).
- 🧠 **IA Avançada:** Utiliza modelos Gemini 2.5 Flash e Gemini Live para transcrição em tempo real e análise profunda.
- 🚀 **Moderno:** Construído com React, TailwindCSS, Vite e TypeScript.

---

## 🚀 Como Rodar o Projeto

Este projeto utiliza **Vite** para desenvolvimento e build. Você precisará do Node.js instalado.

### 1. Pré-requisitos
*   **Node.js:** Baixe e instale a versão LTS em [nodejs.org](https://nodejs.org).
*   **API Key:** Obtenha gratuitamente no [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Instalação
Abra o terminal na pasta do projeto e execute:

```bash
# Instalar dependências
npm install
```

### 3. Rodar Localmente
```bash
# Iniciar servidor de desenvolvimento
npm run dev
```
O terminal mostrará um link (geralmente `http://localhost:5173`). Abra-o no navegador.

---

## 🛠️ Como Usar

1. **Acesse o App:** Abra o endereço do servidor local.
2. **Identifique-se:** Digite seu nome (sem senha necessária).
3. **Configure a IA:** Vá em **Configurações** e cole sua API Key do Google Gemini.
4. **Pratique:** Inicie uma gravação livre ou use o modo guiado.
5. **Evolua:** Veja seus relatórios, aceite desafios e melhore sua comunicação.

---

## 🏗️ Estrutura do Projeto

- **/components**: Componentes React da interface.
- **/services**: Lógica de conexão com a IA (`geminiService`) e banco de dados local (`dbService`).
- **/contexts**: Gerenciamento de estado global (Usuário, Sessão, Gamificação).

## 🤝 Contribuindo

Contribuições são muito bem-vindas!
1. Faça um Fork do projeto.
2. Crie uma Branch para sua Feature (`git checkout -b feature/IncrivelFeature`).
3. Commit suas mudanças (`git commit -m 'Add some IncrivelFeature'`).
4. Push para a Branch (`git push origin feature/IncrivelFeature`).
5. Abra um Pull Request.

---

**Licença MIT** - Desenvolvido por [Professor André Almeida](https://github.com/Professor-AndreAlmeida)