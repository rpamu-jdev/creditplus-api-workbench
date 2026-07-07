import { createContext, useContext, type ReactNode } from 'react';
import { useConfig } from '../hooks/useConfig';
import type { AppConfig } from '../types';

interface ConfigContextValue {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig | null>>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const value = useConfig();
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useAppConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useAppConfig must be used within ConfigProvider');
  return ctx;
}
