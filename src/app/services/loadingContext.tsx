import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  show: (message?: string, onDismiss?: () => void) => void;
  hide: () => void;
  visible: boolean;
  message: string | null;
}

const LoadingContext = createContext<LoadingContextType>({
  show: () => {},
  hide: () => {},
  visible: false,
  message: null,
});

export const LoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [onDismiss, setOnDismiss] = useState<(() => void) | null>(null);

  const show = (msg?: string, callback?: () => void) => {
    setMessage(msg || null);
    setVisible(true);
    setOnDismiss(() => callback || null);
  };

  const hide = () => {
    setVisible(false);
    setMessage(null);
    if (onDismiss) onDismiss();
  };

  return (
    <LoadingContext.Provider value={{ show, hide, visible, message }}>
      {children}
      {visible && (
        <div className="loading-overlay">
          <div className="spinner" />
          {message && <p>{message}</p>}
        </div>
      )}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
