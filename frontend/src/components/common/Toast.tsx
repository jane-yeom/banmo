'use client';

import { useEffect, useState } from 'react';
import { Toast as ToastType, ToastType as TType } from '@/hooks/useToast';

const STYLES: Record<TType, { bg: string; icon: string }> = {
  success: { bg: 'bg-green-500', icon: '✓' },
  error:   { bg: 'bg-red-500',   icon: '✕' },
  info:    { bg: 'bg-blue-500',  icon: 'ℹ' },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastType;
  onDismiss: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // mount 애니메이션
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), 2700);
    return () => clearTimeout(t);
  }, []);

  const { bg, icon } = STYLES[toast.type];

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg transition-all duration-300 ${bg} ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      }`}
    >
      <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
        {icon}
      </span>
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-2 flex-shrink-0 text-white/70 hover:text-white text-xs"
      >
        ✕
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  dismiss: (id: string) => void;
}

export default function ToastContainer({ toasts, dismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0 sm:w-auto">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
