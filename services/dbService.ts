import { openDB, DBSchema } from 'idb';
import { Session, Challenge, Persona } from '../types';

const DB_NAME = 'vOxDB';
const DB_VERSION = 3; // Incremented version to trigger upgrade
const SESSIONS_STORE = 'sessions';
const CHALLENGES_STORE = 'challenges';
const PERSONAS_STORE = 'personas';

interface vOxDBSchema extends DBSchema {
  [SESSIONS_STORE]: {
    key: string;
    value: Session;
  };
  [CHALLENGES_STORE]: {
    key: string;
    value: Challenge;
  };
  [PERSONAS_STORE]: {
    key: string;
    value: Persona;
  }
}

const dbPromise = openDB<vOxDBSchema>(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
      db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
    }
    if (oldVersion < 2) {
      if (!db.objectStoreNames.contains(CHALLENGES_STORE)) {
        db.createObjectStore(CHALLENGES_STORE, { keyPath: 'id' });
      }
    }
    if (oldVersion < 3) {
        if (!db.objectStoreNames.contains(PERSONAS_STORE)) {
            db.createObjectStore(PERSONAS_STORE, { keyPath: 'id' });
        }
    }
    // Note: We don't delete GOALS_STORE here to avoid data loss if user downgrades, 
    // but we remove the TypeScript interface for it.
  },
});

// --- Sessions ---
export const getAllSessions = async (): Promise<Session[]> => {
  const db = await dbPromise;
  return db.getAll(SESSIONS_STORE);
};

export const addSession = async (session: Session): Promise<void> => {
  const db = await dbPromise;
  await db.add(SESSIONS_STORE, session);
};

export const updateSession = async (session: Session): Promise<void> => {
  const db = await dbPromise;
  await db.put(SESSIONS_STORE, session);
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  const db = await dbPromise;
  await db.delete(SESSIONS_STORE, sessionId);
};

// --- Challenges ---
export const getAllChallenges = async (): Promise<Challenge[]> => {
    const db = await dbPromise;
    return db.getAll(CHALLENGES_STORE);
};

export const addChallenge = async (challenge: Challenge): Promise<void> => {
    const db = await dbPromise;
    await db.add(CHALLENGES_STORE, challenge);
};

export const updateChallenge = async (challenge: Challenge): Promise<void> => {
    const db = await dbPromise;
    await db.put(CHALLENGES_STORE, challenge);
};

export const deleteChallenge = async (challengeId: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(CHALLENGES_STORE, challengeId);
};

// --- Personas ---
export const getAllPersonas = async (): Promise<Persona[]> => {
    const db = await dbPromise;
    return db.getAll(PERSONAS_STORE);
};

export const addPersona = async (persona: Persona): Promise<void> => {
    const db = await dbPromise;
    await db.add(PERSONAS_STORE, persona);
};

export const updatePersona = async (persona: Persona): Promise<void> => {
    const db = await dbPromise;
    await db.put(PERSONAS_STORE, persona);
};

export const deletePersona = async (personaId: string): Promise<void> => {
    const db = await dbPromise;
    await db.delete(PERSONAS_STORE, personaId);
};