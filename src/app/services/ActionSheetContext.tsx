import React, { createContext, useContext, useState, ReactNode } from 'react';
import ActionSheet from './actionSheet/actionSheet';

type Option = {
  text: string;
  onClick: () => void;
};

interface ActionSheetContextType {
  showActionSheet: (options: Option[]) => void;
}

const ActionSheetContext = createContext<ActionSheetContextType | null>(null);

export const useActionSheet = () => {
  const ctx = useContext(ActionSheetContext);
  if (!ctx) throw new Error("useActionSheet must be used within ActionSheetProvider");
  return ctx;
};

export const ActionSheetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<Option[] | null>(null);

  const showActionSheet = (opts: Option[]) => {
    setOptions(opts);
  };

  const close = () => setOptions(null);

  return (
    <ActionSheetContext.Provider value={{ showActionSheet }}>
      {children}
      {options && (
        <ActionSheet options={options} onClose={close} />
      )}
    </ActionSheetContext.Provider>
  );
};
