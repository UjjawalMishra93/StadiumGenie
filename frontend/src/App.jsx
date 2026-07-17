import React, { useState } from 'react';
import { Users, Shield } from 'lucide-react';
import FanView from './pages/FanView';
import OpsConsole from './pages/OpsConsole';
import AccessibilityToggle from './components/Accessibility/AccessibilityToggle';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import './index.css';

const VIEWS = [
  { id: 'fan',  label: 'Fan App',    icon: Users,  desc: 'Concierge & info' },
  { id: 'ops',  label: 'Ops Console', icon: Shield, desc: 'Staff dashboard' },
];

function Header({ view, setView }) {
  return (
    <header className="bg-brand-card border-b border-brand-border px-4 py-3 flex items-center gap-3 sticky top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-red to-red-800 flex items-center justify-center text-lg font-black leading-none shadow-lg"
          aria-hidden="true">
          ⚽
        </div>
        <div>
          <span className="font-extrabold text-base tracking-tight">StadiumGenie</span>
          <span className="block text-[10px] text-brand-muted leading-none">FIFA World Cup 2026</span>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex-1 flex justify-center">
        <div className="flex bg-brand-border rounded-xl p-1 gap-1" role="tablist" aria-label="View selector">
          {VIEWS.map(v => {
            const Icon = v.icon;
            const isActive = view === v.id;
            return (
              <button
                key={v.id}
                id={`view-${v.id}`}
                onClick={() => setView(v.id)}
                role="tab"
                aria-selected={isActive}
                aria-label={v.label}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                  isActive ? 'bg-brand-red text-white' : 'text-brand-muted hover:text-white'
                }`}
              >
                <Icon size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AccessibilityToggle />
    </header>
  );
}

function App() {
  const [view, setView] = useState('fan');

  return (
    <AccessibilityProvider>
      <div className="flex flex-col h-screen max-w-2xl mx-auto bg-brand-dark shadow-2xl">
        <Header view={view} setView={setView} />
        <main className="flex-1 overflow-hidden flex flex-col min-h-0" id="main-content">
          {view === 'fan' ? <FanView /> : <OpsConsole />}
        </main>
      </div>
    </AccessibilityProvider>
  );
}

export default App;
