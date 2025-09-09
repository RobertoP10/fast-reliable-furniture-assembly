import { createRoot } from 'react-dom/client'
import * as Sentry from "@sentry/react";
import App from './App.tsx'
import './index.css'

// Initialize Sentry only in production
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Set sample rates to avoid 429 errors
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

createRoot(document.getElementById("root")!).render(<App />);
