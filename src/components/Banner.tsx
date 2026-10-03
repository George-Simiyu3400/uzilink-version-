import React from "react";
import { CheckCircle, AlertTriangle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const bgColors = {
            success: "bg-[#0B3C25] text-emerald-100 border-emerald-800",
            error: "bg-[#451111] text-rose-100 border-rose-900",
            info: "bg-[#0D2A4A] text-[#86CDFC] border-[#1D4A7A]"
          };

          const icons = {
            success: <CheckCircle className="w-5 h-5 text-emerald-400" id={`icon-success-${toast.id}`} />,
            error: <AlertTriangle className="w-5 h-5 text-rose-400" id={`icon-error-${toast.id}`} />,
            info: <Info className="w-5 h-5 text-[#3CA6FC]" id={`icon-info-${toast.id}`} />
          };

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`p-4 rounded-xl border flex items-start gap-3 shadow-xl ${bgColors[toast.type]}`}
              id={`toast-${toast.id}`}
            >
              {icons[toast.type]}
              <div className="flex-1 text-sm font-medium">{toast.message}</div>
              <button
                onClick={() => onClose(toast.id)}
                className="text-white/40 hover:text-white/80 p-0.5 rounded transition"
                id={`toast-close-${toast.id}`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
