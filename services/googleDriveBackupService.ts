import { BackupPayload, createBackupFileName, parseBackupText, stringifyBackupPayload } from './backupService';

const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GAPI_SCRIPT_SRC = 'https://apis.google.com/js/api.js';

type ScriptWindow = Window & {
  google?: any;
  gapi?: any;
};

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number;
}

export interface DriveFileRef {
  id: string;
  name: string;
}

export interface DriveUploadResult extends DriveFileRef {
  webViewLink?: string;
}

let cachedToken: CachedToken | null = null;

export const isGoogleDriveBackupConfigured = (): boolean => (
  Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
);

export const isGooglePickerConfigured = (): boolean => (
  Boolean(import.meta.env.VITE_GOOGLE_PICKER_API_KEY && import.meta.env.VITE_GOOGLE_APP_ID)
);

const loadScript = (src: string): Promise<void> => new Promise((resolve, reject) => {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === 'true') {
      resolve();
      return;
    }
    existing.addEventListener('load', () => resolve(), { once: true });
    existing.addEventListener('error', () => reject(new Error(`Falha ao carregar script ${src}`)), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    script.dataset.loaded = 'true';
    resolve();
  };
  script.onerror = () => reject(new Error(`Falha ao carregar script ${src}`));
  document.head.appendChild(script);
});

const getWindow = (): ScriptWindow => window as ScriptWindow;

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('Google Drive nao configurado.');
  }

  await loadScript(GIS_SCRIPT_SRC);

  return new Promise((resolve, reject) => {
    const google = getWindow().google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services indisponivel.'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_FILE_SCOPE,
      callback: (response: TokenResponse) => {
        if (response.error || !response.access_token) {
          reject(new Error(response.error || 'Autorizacao do Google Drive cancelada.'));
          return;
        }

        cachedToken = {
          accessToken: response.access_token,
          expiresAt: Date.now() + ((response.expires_in || 3600) * 1000),
        };
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: '' });
  });
};

export const exportBackupToDrive = async (payload: BackupPayload): Promise<DriveUploadResult> => {
  const accessToken = await getAccessToken();
  const boundary = `vox_backup_${Date.now()}`;
  const metadata = {
    name: createBackupFileName(),
    mimeType: 'application/json',
  };

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    stringifyBackupPayload(payload),
    `--${boundary}--`,
    '',
  ].join('\r\n');

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Falha ao exportar para o Google Drive (${response.status}).`);
  }

  return response.json();
};

const loadGooglePicker = async (): Promise<void> => {
  await loadScript(GAPI_SCRIPT_SRC);

  const gapi = getWindow().gapi;
  if (!gapi?.load) {
    throw new Error('Google API loader indisponivel.');
  }

  await new Promise<void>((resolve) => {
    gapi.load('picker', { callback: resolve });
  });
};

export const pickBackupFromDrive = async (): Promise<DriveFileRef | null> => {
  if (!isGooglePickerConfigured()) {
    throw new Error('Google Picker nao configurado.');
  }

  const [accessToken] = await Promise.all([
    getAccessToken(),
    loadGooglePicker(),
  ]);

  return new Promise((resolve, reject) => {
    const google = getWindow().google;
    if (!google?.picker) {
      reject(new Error('Google Picker indisponivel.'));
      return;
    }

    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setMimeTypes('application/json')
      .setSelectFolderEnabled(false);

    const picker = new google.picker.PickerBuilder()
      .setAppId(import.meta.env.VITE_GOOGLE_APP_ID)
      .setOAuthToken(accessToken)
      .setDeveloperKey(import.meta.env.VITE_GOOGLE_PICKER_API_KEY)
      .addView(view)
      .setCallback((data: any) => {
        if (data.action === google.picker.Action.CANCEL) {
          resolve(null);
          return;
        }

        if (data.action === google.picker.Action.PICKED) {
          const [doc] = data.docs || [];
          if (!doc?.id) {
            reject(new Error('Arquivo selecionado sem identificador.'));
            return;
          }

          resolve({ id: doc.id, name: doc.name || 'backup.json' });
        }
      })
      .build();

    picker.setVisible(true);
  });
};

export const downloadBackupFromDrive = async (fileId: string): Promise<BackupPayload> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao importar do Google Drive (${response.status}).`);
  }

  return parseBackupText(await response.text());
};
