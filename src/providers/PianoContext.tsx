'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PianoContextType {
  isWidgetVisible: boolean;
  showWidget: () => void;
  hideWidget: () => void;
}

const PianoContext = createContext<PianoContextType | undefined>(undefined);

export function PianoProvider({ children }: { children: ReactNode }) {
  const [isWidgetVisible, setIsWidgetVisible] = useState(false);

  const showWidget = () => {
    setIsWidgetVisible(true);
  };

  const hideWidget = () => {
    setIsWidgetVisible(false);
  };

  return (
    <PianoContext.Provider value={{ isWidgetVisible, showWidget, hideWidget }}>
      {children}
    </PianoContext.Provider>
  );
}

export function usePiano() {
  const context = useContext(PianoContext);
  if (context === undefined) {
    throw new Error('usePiano must be used within a PianoProvider');
  }
  return context;
}
