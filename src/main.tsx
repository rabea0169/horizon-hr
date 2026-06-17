import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { ThemeProvider } from '@/hooks/useTheme'
import { TRPCProvider } from '@/providers/trpc'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'

/** Register Service Worker for PWA support */
function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service Worker registered:", reg.scope))
        .catch((err) => console.warn("[PWA] Service Worker registration failed:", err));
    }
  }, []);
  return null;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <TRPCProvider>
        <ThemeProvider>
          <SWRegister />
          <Toaster position="top-center" richColors closeButton />
          <App />
        </ThemeProvider>
      </TRPCProvider>
    </HashRouter>
  </StrictMode>,
)
