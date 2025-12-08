import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: 'bg-emerald-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-600 text-white',
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5" />,
    error: <AlertCircle className="h-5 w-5" />,
    info: <Info className="h-5 w-5" />,
  };

  // Render using portal to ensure it sits on top of all other elements (modals, overlays)
  return createPortal(
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[99999] flex items-center gap-3 px-6 py-3.5 rounded-2xl shadow-2xl shadow-black/10 ${styles[type]} backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-4 fade-in`}>
      <div className="shrink-0">
        {icons[type]}
      </div>
      <p className="font-medium text-sm font-geist">{message}</p>
      <button 
        onClick={onClose} 
        className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>,
    document.body
  );
};

export default Toast;