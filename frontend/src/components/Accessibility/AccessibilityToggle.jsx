import React from 'react';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { Eye, EyeOff } from 'lucide-react';

export default function AccessibilityToggle() {
  const { isAccessibilityMode, toggleAccessibilityMode } = useAccessibility();

  return (
    <button
      id="accessibility-toggle"
      onClick={toggleAccessibilityMode}
      aria-pressed={isAccessibilityMode}
      aria-label={isAccessibilityMode ? 'Disable accessibility mode' : 'Enable accessibility mode'}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl font-medium text-sm transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-brand-gold
        ${isAccessibilityMode
          ? 'bg-brand-gold text-brand-dark'
          : 'bg-brand-border text-white hover:bg-blue-900/40'}
      `}
      title="Toggle accessibility mode"
    >
      {isAccessibilityMode ? <Eye size={16} aria-hidden="true" /> : <EyeOff size={16} aria-hidden="true" />}
      <span className="hidden sm:inline">
        {isAccessibilityMode ? 'Accessibility ON' : 'Accessibility'}
      </span>
    </button>
  );
}
