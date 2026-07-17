import React, { useState } from 'react';
import { Train, Bus, Car, Leaf, Clock } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const TRANSPORT_OPTIONS = [
  {
    id: 'metro',
    icon: Train,
    name: 'Metro Line 2',
    eta: '8 min',
    frequency: 'Every 8 min',
    sustainability: 'high',
    co2: 'Low carbon',
    tip: 'Fastest & most eco-friendly',
    color: 'text-emerald-400',
  },
  {
    id: 'shuttle',
    icon: Bus,
    name: 'Fan Shuttle (Blue)',
    eta: '15 min',
    frequency: 'Every 15 min',
    sustainability: 'medium',
    co2: 'Medium carbon',
    tip: 'From Blue Lot — accessible buses',
    color: 'text-blue-400',
  },
  {
    id: 'parking',
    icon: Car,
    name: 'Red Lot Parking',
    eta: '20–35 min',
    frequency: 'Open 4h before',
    sustainability: 'low',
    co2: 'Higher emissions',
    tip: 'Accessible spaces in Row A',
    color: 'text-amber-400',
  },
];

function SustainabilityBadge({ level }) {
  const cfg = {
    high:   { cls: 'badge-green',  label: '🌿 Low Carbon' },
    medium: { cls: 'badge-yellow', label: '🟡 Medium' },
    low:    { cls: 'badge-red',    label: '🔴 Higher Emissions' },
  };
  const c = cfg[level];
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

export default function TransportAdvisor() {
  const [geminiSuggestion, setGeminiSuggestion] = useState('');
  const [loading, setLoading] = useState(false);

  const getGeminiAdvice = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'What is the best way to get home from AT&T Stadium right now considering current crowd levels and sustainability? Keep it to 2 sentences.' }],
        }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'chunk') text += evt.text;
          } catch {}
        }
      }
      setGeminiSuggestion(text);
    } catch {
      setGeminiSuggestion('Metro Line 2 is the recommended option — fastest and lowest emissions right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">Smart Transport Advisor</h2>
          <p className="text-xs text-brand-muted mt-0.5">Estimated times · Sustainability ratings</p>
        </div>
        <Leaf size={20} className="text-emerald-400" aria-hidden="true" />
      </div>

      {/* Transport options */}
      <div className="space-y-3" role="list" aria-label="Transport options">
        {TRANSPORT_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <div key={opt.id} className="bg-brand-border rounded-xl p-4 flex items-center gap-4" role="listitem">
              <div className={`w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center flex-shrink-0 ${opt.color}`}>
                <Icon size={20} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{opt.name}</span>
                  <SustainabilityBadge level={opt.sustainability} />
                </div>
                <p className="text-xs text-brand-muted mt-0.5">{opt.tip}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-1 text-sm font-bold text-white">
                  <Clock size={13} aria-hidden="true" className="text-brand-muted" />
                  {opt.eta}
                </div>
                <p className="text-xs text-brand-muted">{opt.frequency}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Gemini suggestion */}
      {geminiSuggestion ? (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3 animate-fade-in" aria-live="polite">
          <p className="text-xs font-semibold text-blue-400 mb-1">🤖 AI Recommendation</p>
          <p className="text-sm text-white leading-relaxed">{geminiSuggestion}</p>
        </div>
      ) : (
        <button
          id="transport-ai-btn"
          onClick={getGeminiAdvice}
          disabled={loading}
          className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
          aria-label="Get AI transport recommendation"
        >
          {loading
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true" /> Getting AI advice…</>
            : <><span aria-hidden="true">✨</span> Get AI Recommendation</>
          }
        </button>
      )}
    </div>
  );
}
