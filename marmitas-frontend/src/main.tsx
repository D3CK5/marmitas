import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from './state/api'
import { performanceMonitor } from './utils/monitoring'
import { reportWebVitals } from './utils/performance'

// Inicializar monitoramento de performance
performanceMonitor.init({
  enabled: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1, // 100% em dev, 10% em produção
  endpoint: process.env.NODE_ENV === 'production' ? '/api/monitoring/metrics' : undefined,
});

// Reportar Web Vitals
reportWebVitals();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>,
) 