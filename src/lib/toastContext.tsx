"use client";
import Toast, { ToastMessage } from "@/components/Toast";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export const ToastContext = createContext({
  toast: (params: ToastMessage) => Promise.resolve(),
});

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastContextProvider');
  }
  return context;
};

const ToastContextProvider = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastType, setToastType] = useState<ToastMessage["type"]>("info");
  // Bumped on every toast() call so the dismiss timer resets even when the
  // same message fires twice in a row.
  const [toastNonce, setToastNonce] = useState<number>(0);

  const value = useMemo(
    () => ({
      toast: async (params: ToastMessage) => {
        setToastMessage(params.message);
        setToastType(params.type);
        setToastNonce((n) => n + 1);
        setIsVisible(true);
      },
    }),
    []
  );

  useEffect(() => {
    if (isVisible && toastMessage) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Clear message after animation completes
        setTimeout(() => {
          setToastMessage("");
        }, 300);
      }, 4000);

      // Clean up the timer when a newer toast arrives or on unmount
      return () => clearTimeout(timer);
    }
  }, [isVisible, toastMessage, toastNonce]);

  return (
    <div className="relative z-50">
      <ToastContext.Provider value={value}>
        {isVisible && toastMessage && <Toast type={toastType} message={toastMessage} />}
        {children}
      </ToastContext.Provider>
    </div>
  );
};

export default ToastContextProvider;
