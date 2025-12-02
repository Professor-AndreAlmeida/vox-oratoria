import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { hasApiKey, getApiKey } from '../services/apiKeyService';
import { getSelectedModel, saveSelectedModel } from '../services/modelService';
import { AiModelId } from '../types';

interface SettingsContextType {
  isApiKeySet: boolean;
  apiKey: string | null;
  refreshApiKeyStatus: () => void;
  selectedModel: AiModelId;
  setModel: (model: AiModelId) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<AiModelId>('gemini-2.5-flash');

  const refreshApiKeyStatus = useCallback(() => {
    setIsApiKeySet(hasApiKey());
    setApiKey(getApiKey());
  }, []);

  const setModel = useCallback((model: AiModelId) => {
      saveSelectedModel(model);
      setSelectedModel(model);
  }, []);

  useEffect(() => {
    refreshApiKeyStatus();
    setSelectedModel(getSelectedModel());
  }, [refreshApiKeyStatus]);

  const value = { 
      isApiKeySet, 
      apiKey, 
      refreshApiKeyStatus,
      selectedModel,
      setModel
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};