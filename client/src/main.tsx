import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeVariantProvider } from './context/ThemeContext';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeVariantProvider>
        <App />
      </ThemeVariantProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
