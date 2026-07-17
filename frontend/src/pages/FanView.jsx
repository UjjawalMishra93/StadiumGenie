import React, { useState } from 'react';
import { MessageCircle, BarChart2, Truck, AlertCircle, Info } from 'lucide-react';
import ChatWindow from '../components/Concierge/ChatWindow';
import ChatInput from '../components/Concierge/ChatInput';
import CrowdMap from '../components/Dashboard/CrowdMap';
import TransportAdvisor from '../components/Transport/TransportAdvisor';
import AssistRequestForm from '../components/Accessibility/AssistRequestForm';
import { useChat } from '../hooks/useChat';
import { useDashboard } from '../hooks/useDashboard';
import { useAccessibility } from '../contexts/AccessibilityContext';
import MetricsPanel from '../components/MetricsPanel';

const TABS = [
  { id: 'chat',      label: 'Concierge',  icon: MessageCircle },
  { id: 'crowd',     label: 'Crowd Map',  icon: BarChart2 },
  { id: 'transport', label: 'Transport',  icon: Truck },
  { id: 'assist',    label: 'Assistance', icon: AlertCircle },
  { id: 'about',     label: 'About',      icon: Info },
];

export default function FanView() {
  const [activeTab, setActiveTab] = useState('chat');
  const { isAccessibilityMode } = useAccessibility();
  const { messages, isStreaming, streamingText, sendMessage } = useChat({ accessibilityMode: isAccessibilityMode });
  const { data: dashboard } = useDashboard();

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <nav className="border-b border-brand-border bg-brand-card/50 backdrop-blur-sm sticky top-0 z-10"
        aria-label="Fan navigation">
        <div className="flex overflow-x-auto scrollbar-hide px-2 gap-1 py-1.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                aria-selected={isActive}
                aria-label={tab.label}
                role="tab"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-brand-gold
                  ${isActive
                    ? 'bg-brand-red text-white'
                    : 'text-brand-muted hover:text-white hover:bg-brand-border'
                  }`}
              >
                <Icon size={16} aria-hidden="true" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0" role="tabpanel">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <ChatWindow
              messages={messages}
              isStreaming={isStreaming}
              streamingText={streamingText}
              isAccessibilityMode={isAccessibilityMode}
            />
            <ChatInput onSend={sendMessage} disabled={isStreaming} />
          </div>
        )}

        {activeTab === 'crowd' && (
          <div className="flex-1 overflow-y-auto p-4">
            <CrowdMap
              zones={dashboard?.zones}
              aiSummary={dashboard?.aiSummary}
              simulated={dashboard?.simulated}
            />
          </div>
        )}

        {activeTab === 'transport' && (
          <div className="flex-1 overflow-y-auto p-4">
            <TransportAdvisor />
          </div>
        )}

        {activeTab === 'assist' && (
          <div className="flex-1 overflow-y-auto p-4">
            <AssistRequestForm />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="flex-1 overflow-y-auto p-4">
            <MetricsPanel />
          </div>
        )}
      </div>
    </div>
  );
}
