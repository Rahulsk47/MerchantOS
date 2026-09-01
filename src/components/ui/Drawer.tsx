import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function Drawer({ open, onClose, title, subtitle, size = 'md', children }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className={`fixed right-0 top-0 bottom-0 z-50 w-full ${sizeClasses[size] || 'max-w-md'} bg-ink-850 border-l border-ink-700/60 shadow-glow flex flex-col`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {(title || subtitle) && (
              <div className="flex items-start justify-between p-5 border-b border-ink-700/50">
                <div>
                  {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
                  {subtitle && <p className="text-xs text-ink-400 mt-1">{subtitle}</p>}
                </div>
                <button onClick={onClose} className="text-ink-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
