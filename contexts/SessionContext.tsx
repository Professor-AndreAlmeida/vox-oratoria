import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, PracticeAttempt, QAInteraction, AnalysisReport, Persona, QASession } from '../types';
import * as db from '../services/dbService';

interface SessionContextType {
  sessions: Session[];
  selectedSession: Session | null;
  isLoading: boolean;
  addSession: (session: Session) => Promise<Session>;
  updateSession: (session: Session) => Promise<Session>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
  selectSession: (session: Session | null) => void;
  toggleFavorite: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, newTitle: string) => Promise<void>;
  addPracticeAttempt: (attempt: PracticeAttempt, originalSessionId: string) => Promise<Session>;
  addQAInteractions: (interactions: QAInteraction[], sessionId: string, persona: Persona) => Promise<Session>;
  updatePulpitContent: (newContent: string, sessionId: string) => Promise<Session>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateAndSortSessions = useCallback((updatedSessions: Session[]) => {
    const sorted = updatedSessions.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    setSessions(sorted);
  }, []);

  useEffect(() => {
    const loadSessions = async () => {
      setIsLoading(true);
      try {
        const savedSessions = await db.getAllSessions();
        updateAndSortSessions(savedSessions);
      } catch (error) {
        console.error("Failed to load sessions from IndexedDB:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSessions();
  }, [updateAndSortSessions]);

  const addSession = async (session: Session): Promise<Session> => {
    await db.addSession(session);
    updateAndSortSessions([session, ...sessions]);
    return session;
  };

  const updateSession = async (session: Session): Promise<Session> => {
    await db.updateSession(session);
    const updated = sessions.map(s => (s.id === session.id ? session : s));
    updateAndSortSessions(updated);
    if (selectedSession?.id === session.id) {
        setSelectedSession(session);
    }
    return session;
  };
  
  const deleteSession = async (sessionId: string): Promise<void> => {
    await db.deleteSession(sessionId);
    updateAndSortSessions(sessions.filter(s => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
        setSelectedSession(null);
    }
  };

  const clearAllSessions = async (): Promise<void> => {
    await Promise.all(sessions.map(s => db.deleteSession(s.id)));
    setSessions([]);
    setSelectedSession(null);
  };

  const selectSession = (session: Session | null) => {
    setSelectedSession(session);
  };
  
  const toggleFavorite = async (sessionId: string): Promise<void> => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const updatedSession = { ...session, isFavorite: !session.isFavorite };
    await updateSession(updatedSession);
  };

  const renameSession = async (sessionId: string, newTitle: string): Promise<void> => {
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    const updatedSession = { ...session, title: newTitle };
    await updateSession(updatedSession);
  };
  
  const addPracticeAttempt = async (attempt: PracticeAttempt, originalSessionId: string): Promise<Session> => {
    const sessionToUpdate = sessions.find(s => s.id === originalSessionId);
    if (!sessionToUpdate) throw new Error("Session not found");
    const updatedSession = { ...sessionToUpdate, practiceAttempts: [...(sessionToUpdate.practiceAttempts || []), attempt] };
    return await updateSession(updatedSession);
  };

  const addQAInteractions = async (interactions: QAInteraction[], sessionId: string, persona: Persona): Promise<Session> => {
    const sessionToUpdate = sessions.find(s => s.id === sessionId);
    if (!sessionToUpdate) throw new Error("Session not found");
    
    const newQASession: QASession = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        persona: persona,
        interactions: interactions
    };

    // Atualiza o histórico (qaSessions) e mantém qaInteractions para retrocompatibilidade ou acesso rápido à última
    const updatedSession = { 
        ...sessionToUpdate, 
        qaInteractions: interactions,
        qaSessions: [...(sessionToUpdate.qaSessions || []), newQASession]
    };
    
    return await updateSession(updatedSession);
  };
  
  const updatePulpitContent = async (newContent: string, sessionId: string): Promise<Session> => {
    const sessionToUpdate = sessions.find(s => s.id === sessionId);
    if (!sessionToUpdate) throw new Error("Session not found");
    const updatedReport = { ...sessionToUpdate.relatorio, textoOtimizado: newContent } as Partial<AnalysisReport>;
    const updatedSession = { ...sessionToUpdate, relatorio: updatedReport };
    return await updateSession(updatedSession);
  };

  const value = {
    sessions,
    selectedSession,
    isLoading,
    addSession,
    updateSession,
    deleteSession,
    clearAllSessions,
    selectSession,
    toggleFavorite,
    renameSession,
    addPracticeAttempt,
    addQAInteractions,
    updatePulpitContent,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};