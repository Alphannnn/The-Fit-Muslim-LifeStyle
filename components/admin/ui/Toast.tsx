"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* A small toast queue. Row-level actions (approve, hide, revoke) navigate
   nowhere, so without this they would succeed in silence. */

export type ToastTone = "success" | "error" | "info";
type Toast = { id: number; tone: ToastTone; message: string };

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastTone, ReactNode> = {
  success: (
    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
  ),
  error: <path d="M12 8v5m0 3.5h.01M12 3l9 16H3l9-16Z" strokeLinecap="round" strokeLinejoin="round" />,
  info: <path d="M12 8h.01M11 12h1v5h1" strokeLinecap="round" strokeLinejoin="round" />,
};

const STYLES: Record<ToastTone, string> = {
  success: "border-success/30 bg-success-soft text-success",
  error: "border-danger/25 bg-danger-soft text-danger",
  info: "border-info/25 bg-info-soft text-info",
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const push = useCallback((message: string, tone: ToastTone = "success") => {
    const id = nextId.current++;
    setToasts((current) => [...current, { id, tone, message }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((t) => t.id !== id)),
      tone === "error" ? 6000 : 3500,
    );
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-5 right-5 z-100 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`admin-toast pointer-events-auto flex items-start gap-2.5 rounded-lg border px-4 py-3 text-[0.83rem] font-medium shadow-[0_8px_24px_-8px_rgba(16,24,40,0.25)] ${STYLES[toast.tone]}`}
          >
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              {ICONS[toast.tone]}
            </svg>
            <span className="leading-snug">{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
