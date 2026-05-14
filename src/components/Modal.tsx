import { X, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare?: () => void;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, onShare, children }: ModalProps) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-4 right-4 top-[10%] bottom-[10%] z-[70] flex flex-col bg-surface-container-low border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(186,158,255,0.15)] overflow-hidden"
          >
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              {onShare && (
                <button
                  onClick={onShare}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                  aria-label="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white border border-white/10 backdrop-blur-md transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
