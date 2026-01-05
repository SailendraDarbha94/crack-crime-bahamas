"use client";
import Toast, { ToastMessage } from "@/components/Toast";
import React, { createContext, useContext, useEffect, useState } from "react";

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

  const toast = async (params: ToastMessage) => {
    setToastMessage(params.message);
    setToastType(params.type);
    setIsVisible(true);
    
    console.log('Toast triggered:', params);
  };

  useEffect(() => {
    if (isVisible && toastMessage) {
      // Set a timer for 4 seconds (longer for better UX)
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Clear message after animation completes
        setTimeout(() => {
          setToastMessage("");
        }, 300);
      }, 4000);

      // Clean up the timer when the component unmounts or visibility changes
      return () => clearTimeout(timer);
    }
  }, [isVisible, toastMessage]);

  return (
    <div className="relative z-50">
      <ToastContext.Provider value={{ toast }}>
        {isVisible && toastMessage && <Toast type={toastType} message={toastMessage} />}
        {children}
      </ToastContext.Provider>
    </div>
  );
};

export default ToastContextProvider;
