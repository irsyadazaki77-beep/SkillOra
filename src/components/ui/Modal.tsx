import React, { useEffect, useRef, useId } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import FocusTrap from "focus-trap-react";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "fullscreen-mobile";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  "fullscreen-mobile": "w-full sm:max-w-2xl h-full sm:h-auto rounded-none sm:rounded-2xl",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  const titleId = useId();
  const descriptionId = useId();

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <FocusTrap focusTrapOptions={{ initialFocus: false, returnFocusOnDeactivate: true }}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descriptionId : undefined}
            className="fixed inset-0 z-[var(--z-modal,70)] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={closeOnBackdropClick ? onClose : undefined}
              className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`relative w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xl z-10 flex flex-col max-h-[90vh] overflow-hidden ${
                sizeStyles[size]
              } ${className}`}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                  <div className="space-y-1 pr-6">
                    {title && (
                      <h3 id={titleId} className="font-display text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p id={descriptionId} className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {description}
                      </p>
                    )}
                  </div>

                  {showCloseButton && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="p-1.5 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      aria-label="Tutup dialog"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="px-5 py-4 overflow-y-auto flex-1 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
