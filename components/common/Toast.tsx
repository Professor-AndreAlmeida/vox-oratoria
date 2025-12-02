import React, { useState, createContext, useContext, useCallback, ReactNode, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon as X, CheckSquare, AlertCircleIcon } from '../icons';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProps {
  message: ToastMessage;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(message.id);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [message, onDismiss]);

  const typeClasses = {
    success: 'bg-green-500/20 border-green-500 text-green-300',
    error: 'bg-red-500/20 border-red-500 text-red-300',
    info: 'bg-sky-500/20 border-sky-500 text-sky-300',
  };
  
  const Icon = {
      success: <CheckSquare className="w-6 h-6" />,
      error: <AlertCircleIcon className="w-6 h-6" />,
      info: <AlertCircleIcon className="w-6 h-6" />
  }[message.type];

  return (
    <div
      className={`relative w-full max-w-sm p-4 pr-10 rounded-lg shadow-lg border animate-toast-in flex items-start gap-3 ${typeClasses[message.type]}`}
      role="alert"
    >
        <div className="flex-shrink-0">{Icon}</div>
        <p className="text-sm font-semibold">{message.message}</p>
        <button
            onClick={() => onDismiss(message.id)}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10"
            aria-label="Fechar"
        >
            <X className="w-4 h-4" />
        </button>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {ReactDOM.createPortal(
        <div className="fixed top-5 right-5 z-[200] space-y-2">
          {toasts.map((toast) => (
            <Toast key={toast.id} message={toast} onDismiss={dismissToast} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
