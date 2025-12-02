import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from '../icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-card border-2 border-border rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b-2 border-border flex-shrink-0">
          <h2 id="modal-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Fechar"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-grow overflow-y-auto">
            {children}
        </main>
        {footer && (
          <footer className="p-4 border-t-2 border-border flex-shrink-0 flex justify-end">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;