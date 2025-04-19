import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryProvider } from './state/api'
import { performanceMonitor } from './utils/monitoring'
import { reportWebVitals } from './utils/performance'
import { initializeWebSockets } from './integrations/websocket'

// Initialize performance monitoring
performanceMonitor.init({
  enabled: true,
  sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1, // 100% in dev, 10% in production
  endpoint: process.env.NODE_ENV === 'production' ? '/api/monitoring/metrics' : undefined,
});

// Report Web Vitals
reportWebVitals();

// Initialize WebSocket integration
initializeWebSockets({
  autoConnect: true
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <App />
    </QueryProvider>
  </React.StrictMode>,
) 