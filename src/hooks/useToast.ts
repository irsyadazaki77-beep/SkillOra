import { useState, useCallback } from "react";

export interface ToastMessage {
  message: string;
  type: "success" | "error" | "info";
}

export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [toastTimeoutId, setToastTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    if (toastTimeoutId) clearTimeout(toastTimeoutId);
    setToast({ message, type });
    const id = setTimeout(() => {
      setToast(null);
    }, 4000);
    setToastTimeoutId(id);
  }, [toastTimeoutId]);

  return {
    toast,
    setToast,
    showToast
  };
}
