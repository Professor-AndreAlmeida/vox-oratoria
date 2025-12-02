import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
    return (
        <>
            <h1>Política de Privacidade</h1>
            <p className="lead">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            
            <p>O <strong>vOx Oratória</strong> é um software <strong>Open Source</strong> e <strong>Local-First</strong>. Nossa filosofia de privacidade é simples: <strong>seus dados pertencem a você e não saem do seu dispositivo para nossos servidores, porque nós não temos servidores.</strong></p>

            <h2>1. Onde meus dados são salvos?</h2>
            <p>Toda a operação do vOx ocorre localmente no seu navegador. Utilizamos tecnologias modernas de armazenamento web:</p>
            <ul>
                <li><strong>IndexedDB:</strong> É aqui que suas sessões de gravação, áudios (blobs), transcrições, relatórios de análise e histórico de desafios são armazenados. Este é um banco de dados que vive dentro do seu navegador (Chrome, Edge, etc.) no seu computador.</li>
                <li><strong>LocalStorage:</strong> Utilizamos para salvar preferências simples, como o "Nome de Usuário" (apenas para exibição), o tema (Claro/Escuro), a preferência de modelo de IA e sua API Key.</li>
            </ul>
            <p><strong>Nós (desenvolvedores do vOx) não temos acesso, não visualizamos e não coletamos nenhum desses dados.</strong></p>

            <h2>2. A API do Google Gemini (Terceiros)</h2>
            <p>Para fornecer a inteligência artificial (transcrição e análise), o vOx conecta seu navegador <strong>diretamente</strong> aos servidores do Google, através da Google Gemini API.</p>
            <ul>
                <li>Quando você clica em "Analisar", o texto ou áudio é enviado do seu computador para o Google.</li>
                <li>O Google processa a informação e devolve a análise para o seu computador.</li>
                <li>Esse tráfego de dados é regido pela <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Política de Uso da Generative AI do Google</a>.</li>
                <li>Ao utilizar o vOx, você entende que seus dados de entrada (áudio/texto) são processados pela Google LLC.</li>
            </ul>

            <h2>3. Sua API Key (Chave de Acesso)</h2>
            <p>O vOx opera no modelo <strong>BYOK (Bring Your Own Key)</strong>. Você insere sua própria chave da API do Google Gemini.</p>
            <ul>
                <li>Sua chave é salva encriptada apenas no armazenamento local do seu navegador.</li>
                <li>Ela nunca é enviada para nós ou para terceiros (exceto, obviamente, para o próprio Google para autenticar suas requisições).</li>
                <li>Você tem total controle para remover ou trocar a chave a qualquer momento nas Configurações.</li>
            </ul>

            <h2>4. Exclusão de Dados</h2>
            <p>Como os dados estão no seu dispositivo, você tem controle total e imediato sobre a exclusão:</p>
            <ul>
                <li><strong>Opção 1 (Via App):</strong> Nas "Configurações", na seção "Zona de Perigo", você pode clicar em "Apagar Tudo (Factory Reset)". Isso instrui o navegador a limpar o banco de dados do vOx.</li>
                <li><strong>Opção 2 (Via Navegador):</strong> Limpar o cache/dados de navegação do seu browser removerá permanentemente todos os registros do vOx.</li>
            </ul>

            <h2>5. Cookies e Rastreamento</h2>
            <p>O vOx <strong>não utiliza</strong> cookies de rastreamento, pixels de marketing (como Facebook Pixel) ou ferramentas de analytics de terceiros (como Google Analytics) para monitorar seu comportamento.</p>

            <h2>6. Backup e Perda de Dados</h2>
            <p>Como não realizamos backup em nuvem, <strong>você é o único responsável pela segurança dos seus dados</strong>. Se você formatar seu computador ou limpar o cache do navegador sem antes usar a função "Exportar Dados" (nas Configurações), suas sessões serão perdidas permanentemente e não poderão ser recuperadas.</p>

            <h2>7. Contato</h2>
            <p>Dúvidas sobre o funcionamento técnico ou privacidade podem ser encaminhadas através do nosso repositório oficial no GitHub.</p>
        </>
    );
};