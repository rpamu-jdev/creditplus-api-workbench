import { useState, useEffect, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Fade from '@mui/material/Fade';
import Box from '@mui/material/Box';
import Layout from './components/Layout';
import AppLoader from './components/AppLoader';
import TabLoader from './components/TabLoader';
import SendRequest from './pages/SendRequest';
import Encrypt from './pages/Encrypt';
import Decrypt from './pages/Decrypt';
import PinEncrypt from './pages/PinEncrypt';
import Logs from './pages/Logs';
import Config from './pages/Config';
import { ConfigProvider, useAppConfig } from './context/ConfigContext';
import { QUOTES } from './components/AppLoader';

function AppRoutes() {
  const { loading } = useAppConfig();
  const location = useLocation();
  const [tabLoading, setTabLoading] = useState(false);
  const switchCount = useRef(0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    switchCount.current = (switchCount.current + 1) % QUOTES.length;
    setTabLoading(true);
    const t = setTimeout(() => setTabLoading(false), 2000);
    return () => clearTimeout(t);
  }, [location.pathname]);

  if (loading) return <AppLoader />;

  if (tabLoading) {
    return (
      <Layout>
        <TabLoader quoteIdx={switchCount.current} />
      </Layout>
    );
  }

  return (
    <Layout>
      <Fade key={location.pathname} in timeout={220}>
        <Box>
          <Routes location={location}>
            <Route path="/"        element={<SendRequest />} />
            <Route path="/encrypt" element={<Encrypt />} />
            <Route path="/decrypt" element={<Decrypt />} />
            <Route path="/pin"     element={<PinEncrypt />} />
            <Route path="/logs"    element={<Logs />} />
            <Route path="/config"  element={<Config />} />
          </Routes>
        </Box>
      </Fade>
    </Layout>
  );
}

export default function App() {
  return (
    <ConfigProvider>
      <AppRoutes />
    </ConfigProvider>
  );
}
