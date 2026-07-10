import { Challenge, Persona, Session, User } from '../types';
import * as db from './dbService';

const BACKUP_VERSION = 2;
const BLOB_MARKER = '__voxBackupBlob';

type BackupBlob = {
  [BLOB_MARKER]: true;
  type: string;
  data: string;
};

export interface BackupPayload {
  version: number;
  timestamp: string;
  sessions: Session[];
  challenges: Challenge[];
  personas: Persona[];
  userSettings: User | null;
}

export interface RestoreSummary {
  sessions: number;
  challenges: number;
  personas: number;
  userSettings: boolean;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (typeof result !== 'string') {
      reject(new Error('Falha ao converter blob do backup.'));
      return;
    }
    resolve(result.split(',')[1] || '');
  };
  reader.onerror = () => reject(reader.error || new Error('Falha ao ler blob do backup.'));
  reader.readAsDataURL(blob);
});

const base64ToBlob = (data: string, type: string): Blob => {
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type });
};

const serializeForBackup = async (value: unknown): Promise<unknown> => {
  if (value instanceof Blob) {
    return {
      [BLOB_MARKER]: true,
      type: value.type,
      data: await blobToBase64(value),
    } satisfies BackupBlob;
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map(serializeForBackup));
  }

  if (isRecord(value)) {
    const entries = await Promise.all(
      Object.entries(value)
        .filter(([key]) => key !== 'audio_url')
        .map(async ([key, nestedValue]) => [key, await serializeForBackup(nestedValue)] as const)
    );
    return Object.fromEntries(entries);
  }

  return value;
};

const deserializeFromBackup = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(deserializeFromBackup);
  }

  if (isRecord(value)) {
    if (value[BLOB_MARKER] === true && typeof value.data === 'string') {
      return base64ToBlob(value.data, typeof value.type === 'string' ? value.type : 'application/octet-stream');
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, deserializeFromBackup(nestedValue)])
    );
  }

  return value;
};

const assertEntityArray = (payload: Record<string, unknown>, key: 'sessions' | 'challenges' | 'personas') => {
  const value = payload[key];
  if (!Array.isArray(value)) {
    throw new Error(`Backup invalido: ${key} deve ser uma lista.`);
  }

  const invalid = value.some(item => !isRecord(item) || typeof item.id !== 'string' || !item.id.trim());
  if (invalid) {
    throw new Error(`Backup invalido: ${key} contem itens sem id valido.`);
  }
};

export const validateBackupPayload = (payload: unknown): BackupPayload => {
  if (!isRecord(payload)) {
    throw new Error('Backup invalido: conteudo precisa ser um objeto JSON.');
  }

  if (typeof payload.version !== 'number' || payload.version < 1 || payload.version > BACKUP_VERSION) {
    throw new Error('Backup invalido: versao nao suportada.');
  }

  if (typeof payload.timestamp !== 'string' || Number.isNaN(Date.parse(payload.timestamp))) {
    throw new Error('Backup invalido: timestamp ausente ou invalido.');
  }

  assertEntityArray(payload, 'sessions');
  assertEntityArray(payload, 'challenges');
  assertEntityArray(payload, 'personas');

  return payload as unknown as BackupPayload;
};

export const buildBackupPayload = async (user: User | null): Promise<BackupPayload> => {
  const [sessions, challenges, personas] = await Promise.all([
    db.getAllSessions(),
    db.getAllChallenges(),
    db.getAllPersonas(),
  ]);

  const payload = {
    version: BACKUP_VERSION,
    timestamp: new Date().toISOString(),
    sessions,
    challenges,
    personas,
    userSettings: user,
  };

  return serializeForBackup(payload) as Promise<BackupPayload>;
};

export const stringifyBackupPayload = (payload: BackupPayload): string => (
  JSON.stringify(payload, null, 2)
);

export const parseBackupText = (text: string): BackupPayload => {
  const parsed = JSON.parse(text);
  return validateBackupPayload(deserializeFromBackup(parsed));
};

export const readBackupFile = (file: File): Promise<BackupPayload> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      resolve(parseBackupText(String(event.target?.result || '')));
    } catch (error) {
      reject(error);
    }
  };
  reader.onerror = () => reject(reader.error || new Error('Falha ao ler arquivo de backup.'));
  reader.readAsText(file);
});

export const createBackupFileName = (date = new Date()): string => {
  const stamp = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `vox-backup-${stamp}.json`;
};

export const restoreBackupPayload = async (
  payload: BackupPayload,
  currentUser: User | null,
  updateUser: (user: User) => Promise<unknown>
): Promise<RestoreSummary> => {
  const backup = validateBackupPayload(payload);

  await Promise.all([
    ...backup.sessions.map(session => db.upsertSession(session)),
    ...backup.challenges.map(challenge => db.upsertChallenge(challenge)),
    ...backup.personas.map(persona => db.upsertPersona(persona)),
  ]);

  let userSettingsRestored = false;
  if (backup.userSettings && currentUser) {
    await updateUser({ ...currentUser, ...backup.userSettings, id: currentUser.id });
    userSettingsRestored = true;
  }

  return {
    sessions: backup.sessions.length,
    challenges: backup.challenges.length,
    personas: backup.personas.length,
    userSettings: userSettingsRestored,
  };
};
