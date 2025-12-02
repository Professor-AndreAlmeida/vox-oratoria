const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const saveApiKey = (apiKey: string): void => {
  if (apiKey) {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
};

export const getApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

export const removeApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};
