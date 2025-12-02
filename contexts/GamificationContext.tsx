import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Challenge, Session, Milestone, GoalType } from '../types';
import * as db from '../services/dbService';
import { generateChallenge } from '../services/geminiService';
import { useSession } from './SessionContext';
import { useToast } from '../components/common/Toast';
import { useSettings } from './SettingsContext';
import { useUser } from './UserContext';

interface GamificationContextType {
  challenges: Challenge[];
  activeChallenge: Challenge | undefined;
  suggestedChallenge: Challenge | undefined;
  isGeneratingChallenge: boolean;
  acceptChallenge: (challengeId: string) => Promise<void>;
  declineChallenge: (challengeId: string) => Promise<void>;
  clearAllGamificationData: () => Promise<void>;
  registerSkillDrillCompletion: (type: GoalType) => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

// Cooldown in ms
const CHALLENGE_GEN_COOLDOWN = 5000; 

// Helper para normalizar strings (remover acentos, lowercase)
const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const GamificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { isApiKeySet } = useSettings();
  const { showToast } = useToast();
  const { sessions } = useSession();

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isGeneratingChallenge, setIsGeneratingChallenge] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const activeChallenge = useMemo(() => challenges.find(c => c.status === 'active'), [challenges]);
  const suggestedChallenge = useMemo(() => challenges.find(c => c.status === 'suggested'), [challenges]);
  
  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
        if (!user) return;
        setIsLoadingData(true);
        try {
            const savedChallenges = await db.getAllChallenges();
            setChallenges(savedChallenges.reverse()); // Mais recentes primeiro
        } catch (error) {
            console.error("Failed to load gamification data from IndexedDB:", error);
        } finally {
            setIsLoadingData(false);
        }
    };
    initializeData();
  }, [user]);

  // Generate new challenge logic
  useEffect(() => {
    const generateNew = async () => {
        if (!user || !isApiKeySet || isGeneratingChallenge || isLoadingData) return;
        
        const hasActiveOrSuggested = challenges.some(c => c.status === 'active' || c.status === 'suggested');
        if (hasActiveOrSuggested) return;

        // Se o último desafio foi recusado (declined), espere mais tempo antes de sugerir outro
        if (challenges.length > 0 && challenges[0].status === 'declined') {
             const declinedDate = localStorage.getItem('vox_last_challenge_generated') || '0';
             // 1 hora de cooldown se recusou
             if (Date.now() - parseInt(declinedDate) < 3600000) return; 
        }

        const lastGenTime = parseInt(localStorage.getItem('vox_last_challenge_generated') || '0');
        if (Date.now() - lastGenTime < CHALLENGE_GEN_COOLDOWN) return;

        if (sessions.length >= 1) { 
            setIsGeneratingChallenge(true);
            try {
                const newChallenge = await generateChallenge(sessions, challenges);
                await db.addChallenge(newChallenge);
                setChallenges(prev => [newChallenge, ...prev]);
                localStorage.setItem('vox_last_challenge_generated', Date.now().toString());
            } catch (error) {
                console.error("Failed to generate challenge:", error);
            } finally {
                setIsGeneratingChallenge(false);
            }
        }
    };
    
    const timer = setTimeout(generateNew, 3000);
    return () => clearTimeout(timer);

  }, [isApiKeySet, challenges, sessions, isGeneratingChallenge, isLoadingData, user]);


  // --- Logic to Check Challenge Milestones (Session Based) ---
  useEffect(() => {
    const checkMilestones = async () => {
        if (!activeChallenge || sessions.length === 0) return;
        
        const sessionToCheck = sessions[0]; // Newest session
        if (!sessionToCheck || !sessionToCheck.relatorio) return;

        let challengeUpdated = false;
        // Deep copy to avoid mutation issues
        const updatedChallenge = JSON.parse(JSON.stringify(activeChallenge)) as Challenge;
        
        // Verifica a tentativa mais recente
        const report = sessionToCheck.practiceAttempts.length > 0
            ? sessionToCheck.practiceAttempts[sessionToCheck.practiceAttempts.length - 1].relatorio
            : sessionToCheck.relatorio;

        if (!report) return;

        const evaluateTarget = (milestone: Milestone): boolean => {
            if (milestone.status === 'completed') return true;
            // Only evaluate session-based tasks here.
            if (milestone.taskType !== 'record_session' && milestone.taskType !== 're_record_session') return false;

            const targetStr = normalize(milestone.target);
            let metricValue: number | undefined;
            let targetValue: number | undefined;
            let operator = '>=';

            // Parser manual mais robusto que Regex
            const parts = targetStr.split(/([<>=]+)/); // Separa por operadores
            if (parts.length < 3) return false;

            const metricName = parts[0].trim();
            operator = parts[1].trim();
            targetValue = parseFloat(parts[2].trim());

            if (isNaN(targetValue)) return false;

            if (metricName.includes('clareza')) metricValue = report.clareza?.nota;
            else if (metricName.includes('vicio') || metricName.includes('filler')) {
                metricValue = (report.palavrasPreenchimento || []).reduce((sum, w) => sum + w.contagem, 0);
            }
            else if (metricName.includes('wpm') || metricName.includes('ritmo')) metricValue = report.wpm?.valor;
            else if (metricName.includes('entonacao')) metricValue = report.entonação?.variacao;
            
            if (metricValue === undefined) return false;

            switch (operator) {
                case '>': return metricValue > targetValue;
                case '>=': return metricValue >= targetValue;
                case '<': return metricValue < targetValue;
                case '<=': return metricValue <= targetValue;
                case '=': case '==': return Math.abs(metricValue - targetValue) < 0.1;
                default: return false;
            }
        };

        updatedChallenge.milestones = updatedChallenge.milestones.map(m => {
            if (m.status === 'pending' && evaluateTarget(m)) {
                challengeUpdated = true;
                return { ...m, status: 'completed' as const };
            }
            return m;
        });

        const allMilestonesCompleted = updatedChallenge.milestones.every(m => m.status === 'completed');

        if (allMilestonesCompleted && updatedChallenge.status !== 'completed') {
            updatedChallenge.status = 'completed';
            updatedChallenge.completedDate = new Date().toISOString();
            challengeUpdated = true;
            setTimeout(() => showToast(`🏆 Desafio "${updatedChallenge.title}" Completado!`, 'success'), 500);
        }

        if (challengeUpdated) {
            await db.updateChallenge(updatedChallenge);
            setChallenges(prev => prev.map(c => c.id === updatedChallenge.id ? updatedChallenge : c));
        }
    };
    
    // Timeout pequeno para garantir que o banco já salvou a sessão antes de ler
    const timeout = setTimeout(checkMilestones, 1000);
    return () => clearTimeout(timeout);

  }, [sessions, activeChallenge, showToast]);

  // --- Logic to Check Challenge Milestones (Skill Drill Based) ---
  const registerSkillDrillCompletion = async (drillType: GoalType) => {
      // Re-fetch active challenge directly from state/db reference to ensure freshness
      // Note: activeChallenge comes from state 'challenges', which we will update.
      
      // Always give immediate positive feedback for the user effort
      showToast('Treino registrado com sucesso!', 'success');

      if (!activeChallenge) {
          console.log("No active challenge to update with skill drill.");
          return;
      }

      let challengeUpdated = false;
      const updatedChallenge = JSON.parse(JSON.stringify(activeChallenge)) as Challenge;

      updatedChallenge.milestones = updatedChallenge.milestones.map(m => {
          if (m.status === 'pending' && m.taskType === 'skill_drill') {
              const target = normalize(m.target);
              const type = normalize(drillType);
              
              // Verificação flexível de compatibilidade
              const matchesClarity = type === 'clarity' && target.includes('clareza');
              const matchesFiller = (type === 'filler_words' || type.includes('filler')) && (target.includes('vicio') || target.includes('filler'));
              const matchesWpm = type === 'wpm' && (target.includes('ritmo') || target.includes('wpm'));
              const matchesIntonation = (type === 'intonation_variety') && (target.includes('entona') || target.includes('entonacao'));

              // Se a IA apenas disse "fazer um skill drill" sem especificar métrica no target (raro mas possível)
              const matchesGeneric = target.includes('skill') || target.includes('treino');

              if (matchesClarity || matchesFiller || matchesWpm || matchesIntonation || matchesGeneric) {
                  challengeUpdated = true;
                  return { ...m, status: 'completed' as const };
              }
          }
          return m;
      });

      if (!challengeUpdated) {
          return; // No milestone matched, but we already gave toast feedback.
      }

      const allMilestonesCompleted = updatedChallenge.milestones.every(m => m.status === 'completed');

      if (allMilestonesCompleted && updatedChallenge.status !== 'completed') {
          updatedChallenge.status = 'completed';
          updatedChallenge.completedDate = new Date().toISOString();
          setTimeout(() => showToast(`🏆 Desafio "${updatedChallenge.title}" Completado!`, 'success'), 500);
      } else {
          // Extra toast if milestone updated
          setTimeout(() => showToast(`Marco do desafio avançado!`, 'success'), 200);
      }

      await db.updateChallenge(updatedChallenge);
      
      // Force update state
      setChallenges(prev => prev.map(c => c.id === updatedChallenge.id ? updatedChallenge : c));
  };

  const acceptChallenge = async (challengeId: string) => {
    // Decline current active if exists
    let challengesToUpdate = challenges.map(c => c.status === 'active' ? { ...c, status: 'declined' as const } : c );
    // Activate new one
    challengesToUpdate = challengesToUpdate.map(c => c.id === challengeId ? { ...c, status: 'active' as const, startDate: new Date().toISOString() } : c );
    
    for (const c of challengesToUpdate) {
        await db.updateChallenge(c);
    }
    setChallenges(challengesToUpdate);
  };

  const declineChallenge = async (challengeId: string) => {
      const updatedChallenges = challenges.map(c => c.id === challengeId ? { ...c, status: 'declined' as const } : c );
      const challengeToUpdate = updatedChallenges.find(c => c.id === challengeId);
      if (challengeToUpdate) {
          await db.updateChallenge(challengeToUpdate);
      }
      setChallenges(updatedChallenges);
      localStorage.setItem('vox_last_challenge_generated', Date.now().toString());
  };

  const clearAllGamificationData = async () => {
      await Promise.all([
          ...challenges.map(c => db.deleteChallenge(c.id)),
      ]);
      setChallenges([]);
  };

  const value = {
    challenges,
    activeChallenge,
    suggestedChallenge,
    isGeneratingChallenge,
    acceptChallenge,
    declineChallenge,
    clearAllGamificationData,
    registerSkillDrillCompletion
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};