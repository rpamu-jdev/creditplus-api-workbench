import { createContext, useContext, useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { makeAppTheme, type ThemeVariant } from '../theme';

interface ThemeCtx {
  variant: ThemeVariant;
  setVariant: (v: ThemeVariant) => void;
}

const Ctx = createContext<ThemeCtx>({ variant: 'light', setVariant: () => {} });

const LS_KEY = 'apileela-theme';

export function ThemeVariantProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<ThemeVariant>(() => {
    const saved = localStorage.getItem(LS_KEY) as ThemeVariant | null;
    return saved && ['light', 'dark'].includes(saved) ? saved : 'light';
  });

  function setVariant(v: ThemeVariant) {
    setVariantState(v);
    localStorage.setItem(LS_KEY, v);
  }

  const theme = useMemo(() => makeAppTheme(variant), [variant]);

  return (
    <Ctx.Provider value={{ variant, setVariant }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </Ctx.Provider>
  );
}

export function useThemeVariant() {
  return useContext(Ctx);
}
