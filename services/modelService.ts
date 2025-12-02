import { AiModelId } from '../types';

const MODEL_STORAGE_KEY = 'vox_ai_model_preference';

export const saveSelectedModel = (modelId: AiModelId): void => {
  localStorage.setItem(MODEL_STORAGE_KEY, modelId);
};

export const getSelectedModel = (): AiModelId => {
  const saved = localStorage.getItem(MODEL_STORAGE_KEY);
  // Validar se o valor salvo é um modelo válido, senão retornar o padrão
  if (saved === 'gemini-2.5-flash' || saved === 'gemini-3-pro-preview') {
      return saved as AiModelId;
  }
  return 'gemini-2.5-flash'; // Default model
};
