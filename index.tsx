import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ToastProvider } from './components/common/Toast';
import { SettingsProvider } from './contexts/SettingsContext';
import { UserProvider } from './contexts/UserContext';
import { SessionProvider } from './contexts/SessionContext';
import { GamificationProvider } from './contexts/GamificationContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <SettingsProvider>
        <UserProvider>
          <SessionProvider>
            <GamificationProvider>
              <App />
            </GamificationProvider>
          </SessionProvider>
        </UserProvider>
      </SettingsProvider>
    </ToastProvider>
  </React.StrictMode>
);