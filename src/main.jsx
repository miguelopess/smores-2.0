import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerSW } from 'virtual:pwa-register'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Register service worker for PWA + push notifications
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      // Verifica atualizações a cada 60 minutos
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
})
