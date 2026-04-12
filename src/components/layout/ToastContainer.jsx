import React from 'react';
import { createPortal } from 'react-dom';
import { useToast } from '../../hooks/useToast';

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
      {toasts.map((t) => (
        <div 
          key={t.id}
          className={`
            pointer-events-auto
            flex items-center justify-between gap-4 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border border-outline-variant/10 slide-up
            ${t.type === 'success' ? 'bg-primary text-on-primary' :
              t.type === 'error' ? 'bg-error text-on-primary' :
              'bg-surface-lowest text-on-surface'}
          `}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[20px]">
              {t.type === 'success' ? 'check_circle' : t.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{t.message}</p>
          </div>
          <button 
            onClick={() => removeToast(t.id)}
            className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};

export default ToastContainer;
