import React from 'react';

export const TermsOfUsePage: React.FC = () => {
    return (
        <>
            <h1>Termos de Uso</h1>
            <p className="lead">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            
            <p>O <strong>vOx Oratória</strong> é um software de código aberto (Open Source), distribuído gratuitamente sob a licença MIT. Ao utilizar este software, você concorda com os termos abaixo.</p>

            <h2>1. Natureza do Serviço</h2>
            <p>O vOx é uma interface cliente (frontend) que facilita a interação com Modelos de Linguagem Grande (LLMs) para fins de treinamento de oratória. O software é fornecido "COMO ESTÁ" (AS IS), sem garantias de qualquer tipo, expressas ou implícitas.</p>

            <h2>2. Responsabilidade sobre a API Key (Custos e Uso)</h2>
            <p>O vOx utiliza o modelo "Traga Sua Própria Chave" (BYOK - Bring Your Own Key).</p>
            <ul>
                <li>Você é inteiramente responsável por obter, configurar e manter sua API Key do Google Gemini.</li>
                <li>Você é responsável por quaisquer custos, cobranças ou limites de uso impostos pelo Google em sua conta pessoal ou empresarial decorrentes do uso desta chave no vOx.</li>
                <li>O vOx Oratória (e seus desenvolvedores) não possui relação comercial com o Google e não se responsabiliza por cobranças indevidas ou suspensão de chaves de API.</li>
            </ul>

            <h2>3. Conteúdo Gerado por IA (Alucinações)</h2>
            <p>As análises, feedbacks e sugestões fornecidas pelo vOx são geradas por Inteligência Artificial (Google Gemini).</p>
            <ul>
                <li><strong>Precisão:</strong> A IA pode cometer erros, gerar informações imprecisas ("alucinações") ou fornecer feedback subjetivo.</li>
                <li><strong>Não é Conselho Profissional:</strong> O feedback do vOx tem fins educacionais e de autodesenvolvimento. Ele não substitui o aconselhamento de um fonoaudiólogo, médico ou coach profissional humano.</li>
                <li>Você deve usar seu julgamento crítico ao aceitar ou aplicar as sugestões da ferramenta.</li>
            </ul>

            <h2>4. Propriedade dos Dados</h2>
            <p>Todo o conteúdo criado por você (gravações de voz, textos, roteiros) é de sua propriedade exclusiva. O vOx não reivindica direitos autorais sobre seus discursos.</p>

            <h2>5. Limitação de Responsabilidade</h2>
            <p>Em nenhuma circunstância os desenvolvedores ou contribuidores do projeto vOx Oratória serão responsáveis por:</p>
            <ul>
                <li>Perda de dados decorrente de limpeza de cache, falha no navegador ou erro do usuário em realizar backups.</li>
                <li>Danos diretos, indiretos, incidentais ou consequenciais resultantes do uso ou incapacidade de usar o software.</li>
                <li>Falhas na disponibilidade da API do Google Gemini.</li>
            </ul>

            <h2>6. Licença de Software</h2>
            <p>O código-fonte do vOx é disponibilizado publicamente no GitHub. Você é livre para inspecionar, auditar, modificar e distribuir o código, respeitando os termos da Licença MIT incluída no repositório.</p>

            <h2>7. Alterações</h2>
            <p>Como este é um software local, os termos aplicáveis são os da versão que você está executando no momento. Atualizações futuras do software podem conter novos termos.</p>
        </>
    );
};