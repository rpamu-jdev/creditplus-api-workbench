import { useState, useEffect, useCallback } from 'react';
import type { AppConfig } from '../types';
import { fetchConfig } from '../api/config';

interface UseConfigResult {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig | null>>;
}

export function useConfig(): UseConfigResult {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const c = await fetchConfig();
      setConfig(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { config, loading, error, reload: load, setConfig };
}
