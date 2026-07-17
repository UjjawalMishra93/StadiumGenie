/* eslint-disable react/only-export-components */
import React, { createContext, useContext, useState } from 'react';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [isAccessibilityMode, setIsAccessibilityMode] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isLargeText, setIsLargeText] = useState(false);

  const toggleAccessibilityMode = () => {
    const next = !isAccessibilityMode;
    setIsAccessibilityMode(next);
    setIsHighContrast(next);
    setIsLargeText(next);
    document.documentElement.classList.toggle('high-contrast', next);
    document.documentElement.style.fontSize = next ? '18px' : '';
  };

  return (
    <AccessibilityContext.Provider value={{
      isAccessibilityMode,
      isHighContrast,
      isLargeText,
      toggleAccessibilityMode,
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return ctx;
}
