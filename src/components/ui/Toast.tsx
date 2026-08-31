import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '@/lib/store';
import type { Toast } from '@/lib/types';

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const tones = {
  success: 'border-success-500/30 text-success-400',
  error: 'border-danger-500/30 text-danger-400',
  warning: 'border-warning-500/30 text-warning-400',
  info: 'border-electric-500/30 text-electric-400',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-3 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast: Toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className={`surface bg-ink-850/95 border ${tones[toast.type]} p-4 pr-10 relative shadow-card`}
            >
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute top-3 right-3 text-ink-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">{toast.title}</p>
                  {toast.message && <p className="text-xs text-ink-300 mt-1">{toast.message}</p>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
