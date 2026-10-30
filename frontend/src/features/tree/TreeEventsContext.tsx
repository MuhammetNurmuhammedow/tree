import React, { createContext, useContext } from 'react';

export interface TreeEventsContextType {
  onAddParent?: (id: string) => void;
  onAddSpouse?: (id: string) => void;
  onAddChild?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  isReadOnly?: boolean;
}

const TreeEventsContext = createContext<TreeEventsContextType>({});

export const TreeEventsProvider: React.FC<{
  value: TreeEventsContextType;
  children: React.ReactNode;
}> = ({ value, children }) => {
  return (
    <TreeEventsContext.Provider value={value}>
      {children}
    </TreeEventsContext.Provider>
  );
};

export const useTreeEvents = () => useContext(TreeEventsContext);
