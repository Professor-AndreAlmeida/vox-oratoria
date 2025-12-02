import React, { useState, useEffect, useRef } from 'react';
import { User, UsageStats, AiModelConfig, AiModelId } from '../types';
import { SettingsIcon, LoadingIcon, CheckSquare, KeyIcon, UserIcon, EyeIcon, EyeOffIcon, CoachIcon, CloudIcon, CloudUploadIcon, Download, TrashIcon, AlertCircleIcon, BrainCircuit } from './icons';
import { saveApiKey, getApiKey, removeApiKey } from '../services/apiKeyService';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useUser } from '../contexts/UserContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSession } from '../contexts/SessionContext';
import { useGamification } from '../contexts/GamificationContext';
import { useToast } from './common/Toast';
import * as db from '../services/dbService';

interface SettingsPageProps {
  usageStats: UsageStats;
}

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-card border border-card-border rounded-xl p-6 shadow-card ${className}`}>
    {children}
  </div>
);

const coachStyleOptions: { id: User['coachStyle'], label: string, description: string }[] = [
    { id: 'encouraging', label: 'Encorajador', description: 'Foco em pontos fortes e motivação.' },
    { id: 'analytical', label: 'Analítico', description: 'Foco em dados, métricas e fatos.' },
    { id: 'technical', label: 'Técnico', description: 'Foco em retórica e estrutura detalhada.' },
]

const aiModelOptions: AiModelConfig[] = [
    { 
        id: 'gemini-2.5-flash', 
        name: 'Gemini 2.5 Flash', 
        description: 'Modelo rápido e eficiente. Ideal para análises gerais e feedback rápido.',
        costEstimate: 'Gratuito (Free Tier Disponível) ou Baixo Custo'
    },
    { 
        id: 'gemini-3-pro-preview', 
        name: 'Gemini 3.0 Pro', 
        description: 'Modelo de raciocínio avançado. Melhor para análises profundas de nuances e storytelling.',
        costEstimate: 'Custo Moderado (Requer Plano Pago em uso intenso)'
    }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ usageStats }) => {
  const { user, updateUser, logout } = useUser();
  const { refreshApiKeyStatus, selectedModel, setModel } = useSettings();
  const { clearAllSessions } = useSession();
  const { clearAllGamificationData } = useGamification();
  const { showToast } = useToast();
  
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [selectedCoachStyle, setSelectedCoachStyle] = useState<User['coachStyle']>(user?.coachStyle || 'encouraging');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKey(getApiKey() || '');
  }, []);

  const handleSaveApiKey = () => {
    setSaveStatus('saving');
    saveApiKey(apiKey);
    refreshApiKeyStatus();
    setTimeout(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };
  
  const handleStyleChange = (style: User['coachStyle']) => {
      if (!user) return;
      setSelectedCoachStyle(style);
      updateUser({ ...user, coachStyle: style });
  };

  const handleExportData = async () => {
      try {
          const sessions = await db.getAllSessions();
          const challenges = await db.getAllChallenges();
          const personas = await db.getAllPersonas();

          const dataToExport = {
              version: 2, // Version bump since goals removed
              timestamp: new Date().toISOString(),
              sessions,
              challenges,
              personas,
              userSettings: user
          };

          const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `vox-backup-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast("Backup exportado com sucesso!", 'success');
      } catch (error) {
          console.error("Export error:", error);
          showToast("Erro ao exportar dados.", 'error');
      }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              
              if (json.sessions) {
                  for (const s of json.sessions) await db.addSession(s);
              }
              if (json.challenges) {
                  for (const c of json.challenges) await db.addChallenge(c);
              }
              if (json.personas) {
                  for (const p of json.personas) await db.addPersona(p);
              }
              if (json.userSettings && user) {
                  await updateUser({ ...user, ...json.userSettings });
              }

              showToast("Dados importados com sucesso! Atualize a página.", 'success');
              // Opcional: window.location.reload();
          } catch (error) {
              console.error("Import error:", error);
              showToast("Arquivo de backup inválido ou corrompido.", 'error');
          }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = '';
  };

  const handleFactoryReset = async () => {
      if (confirm("ATENÇÃO: Isso apagará TODOS os seus dados (sessões, metas, configurações) deste navegador. Esta ação é irreversível. Tem certeza?")) {
          if (confirm("Última confirmação: Você realmente quer resetar tudo? Certifique-se de ter um backup se precisar dos dados.")) {
              try {
                  await clearAllSessions();
                  await clearAllGamificationData();
                  removeApiKey();
                  refreshApiKeyStatus();
                  logout(); // Isso deve limpar também o localStorage do user
                  showToast("Dados resetados com sucesso.", 'success');
                  window.location.reload(); // Recarregar para garantir estado limpo
              } catch (e) {
                  console.error(e);
                  showToast("Erro ao resetar dados.", 'error');
              }
          }
      }
  };
  
  if (!user) {
    return <LoadingIcon className="w-8 h-8 animate-spin" />;
  }

  return (
    <div className="w-full max-w-7xl animate-fade-in space-y-8">
      <div className="flex items-center gap-4">
        <SettingsIcon className="w-8 h-8 text-primary" />
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Configurações</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
            <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><UserIcon className="w-6 h-6" /> Perfil do Usuário</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                <span className="font-semibold text-text-secondary">Nome</span>
                <span className="font-bold text-lg text-white">{user.name}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-background/50 rounded-md">
                <span className="font-semibold text-text-secondary">E-mail</span>
                <span className="font-bold text-lg text-white">{user.email}</span>
                </div>
            </div>
            </Card>
            <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><CoachIcon className="w-6 h-6" /> Estilo do Coach de IA</h3>
            <p className="text-text-secondary mb-6 text-sm">
                Escolha o tom e o foco do feedback da IA para se alinhar melhor com seu estilo de aprendizado.
            </p>
            <div className="space-y-3">
                {coachStyleOptions.map(opt => (
                    <button key={opt.id} onClick={() => handleStyleChange(opt.id)} className={`w-full text-left p-3 rounded-md border-2 transition-colors ${selectedCoachStyle === opt.id ? 'bg-primary/20 border-primary' : 'bg-background/50 border-transparent hover:border-slate-600'}`}>
                        <p className="font-semibold">{opt.label}</p>
                        <p className="text-xs text-text-secondary">{opt.description}</p>
                    </button>
                ))}
            </div>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><KeyIcon className="w-6 h-6" /> Gestão da API Key</h3>
            <p className="text-text-secondary mb-6 text-sm">
                Sua API key do Google Gemini é necessária para o funcionamento da IA. Ela é armazenada <strong>apenas no seu navegador</strong>.
            </p>
            <div className="space-y-4">
                <div className="relative">
                <Input
                    id="api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Cole sua API key aqui"
                    className="pr-10"
                />
                <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowApiKey(!showApiKey)}
                    aria-label={showApiKey ? "Esconder chave" : "Mostrar chave"}
                >
                    {showApiKey ? <EyeOffIcon className="w-5 h-5"/> : <EyeIcon className="w-5 h-5"/>}
                </button>
                </div>
                <Button onClick={handleSaveApiKey} className="w-full" disabled={saveStatus === 'saving' || !apiKey.trim()}>
                {saveStatus === 'saving' ? <><LoadingIcon className="w-4 h-4 mr-2 animate-spin" /> Salvando...</> : (saveStatus === 'saved' ? <><CheckSquare className="w-4 h-4 mr-2" /> Salvo!</> : 'Salvar Chave')}
                </Button>
                <p className="text-xs text-muted-foreground text-center pt-2">
                    Não tem uma chave? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline text-primary/80 hover:text-primary">Crie uma gratuitamente no Google AI Studio.</a>
                </p>
            </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><BrainCircuit className="w-6 h-6" /> Inteligência Artificial</h3>
                <p className="text-text-secondary mb-6 text-sm">
                    Escolha qual modelo do Gemini realizará as análises dos seus discursos.
                </p>
                <div className="space-y-3">
                    {aiModelOptions.map(model => (
                        <button key={model.id} onClick={() => setModel(model.id)} className={`w-full text-left p-4 rounded-md border-2 transition-colors ${selectedModel === model.id ? 'bg-primary/20 border-primary' : 'bg-background/50 border-transparent hover:border-slate-600'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <p className="font-semibold">{model.name}</p>
                                {selectedModel === model.id && <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">Ativo</span>}
                            </div>
                            <p className="text-sm text-text-secondary mb-2">{model.description}</p>
                            <p className="text-xs text-green-400 font-mono flex items-center gap-1">
                                <span>💰</span> {model.costEstimate}
                            </p>
                        </button>
                    ))}
                </div>
            </Card>

            <Card>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3"><CloudIcon className="w-6 h-6" /> Seus Dados (Backup)</h3>
                <p className="text-text-secondary mb-6 text-sm">
                    Como o vOx roda localmente no seu navegador, é importante fazer backups regulares para não perder seu progresso se limpar o cache.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="outline" onClick={handleExportData} className="w-full flex items-center gap-2">
                        <Download className="w-4 h-4" /> Exportar Dados
                    </Button>
                    <Button variant="outline" onClick={handleImportClick} className="w-full flex items-center gap-2">
                        <CloudUploadIcon className="w-4 h-4" /> Importar Backup
                    </Button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImportFile} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>
            </Card>

            <Card className="border-red-900/50 bg-red-950/10">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-3 text-red-400"><AlertCircleIcon className="w-6 h-6" /> Zona de Perigo</h3>
                <p className="text-text-secondary mb-6 text-sm">
                    Ações aqui são irreversíveis. Use com cuidado.
                </p>
                <Button variant="destructive" onClick={handleFactoryReset} className="w-full flex items-center gap-2">
                    <TrashIcon className="w-4 h-4" /> Apagar Tudo (Factory Reset)
                </Button>
            </Card>
        </div>
      </div>
    </div>
  );
};