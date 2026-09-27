import React from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function ToastContainer({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let borderColor = 'border-blue-500/40 bg-slate-900/90 text-blue-200';
        if (toast.type === 'success') {
          Icon = CheckCircle2;
          borderColor = 'border-emerald-500/40 bg-slate-900/90 text-emerald-200';
        } else if (toast.type === 'warning') {
          Icon = AlertCircle;
          borderColor = 'border-amber-500/40 bg-slate-900/90 text-amber-200';
        }

        return (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${borderColor}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
