import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity" onClick={onClose} />
      {/* Sharper corners (rounded-lg) and subtle border glow */}
      <div className="relative bg-[#0f172a] border border-slate-800/80 rounded-lg shadow-2xl shadow-black/50 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 custom-scrollbar ring-1 ring-white/5">
        <div className="flex justify-between items-center p-5 border-b border-slate-800 sticky top-0 bg-[#0f172a]/95 backdrop-blur-sm z-10">
          <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-md">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};