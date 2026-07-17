import React, { useState, useEffect } from 'react';
import { Zap, Clock, Globe, Server } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function MetricsPanel() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/metrics`);
        const data = await res.json();
        setMetrics(data);
      } catch {
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-4">
      {/* About card */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-lg" aria-hidden="true">🏟️</div>
          <div>
            <h2 className="font-bold text-lg">StadiumGenie</h2>
            <p className="text-xs text-brand-muted">Powered by Gemini · FIFA World Cup 2026</p>
          </div>
        </div>
        <p className="text-sm text-brand-muted leading-relaxed">
          A Gemini-powered fan concierge and ops copilot for smart stadium management.
          Covers navigation, crowd monitoring, accessibility, multilingual support, and operations.
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {[
            { icon: '📍', label: 'Navigation', desc: 'Step-by-step directions' },
            { icon: '👥', label: 'Crowd Management', desc: 'Live zone monitoring' },
            { icon: '♿', label: 'Accessibility', desc: 'WCAG 2.1 AA compliant' },
            { icon: '🚇', label: 'Transport', desc: 'Sustainability-aware' },
            { icon: '🌍', label: 'Multilingual', desc: 'Auto language detection' },
            { icon: '🔒', label: 'Ops Intelligence', desc: 'Real-time staff alerts' },
          ].map(f => (
            <div key={f.label} className="bg-brand-border rounded-xl p-3">
              <div className="text-xl mb-1" aria-hidden="true">{f.icon}</div>
              <p className="text-xs font-semibold">{f.label}</p>
              <p className="text-xs text-brand-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Real vs Simulated */}
      <div className="card p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Server size={16} aria-hidden="true" />
          Real vs. Simulated
        </h3>
        <div className="space-y-2">
          {[
            { label: 'Gemini AI responses', real: true },
            { label: 'Multilingual translation', real: true },
            { label: 'Venue knowledge base', real: true },
            { label: 'Crowd / zone occupancy', real: false },
            { label: 'Transit ETAs', real: false },
            { label: 'Incident alerts', real: false },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span className={item.real ? 'badge badge-green' : 'badge badge-yellow'}>
                {item.real ? '✅ Real' : '🟡 Simulated'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Live metrics */}
      {loading ? (
        <div className="card p-5 flex justify-center">
          <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" aria-label="Loading metrics" />
        </div>
      ) : metrics && (
        <div className="card p-5 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Zap size={16} className="text-brand-gold" aria-hidden="true" />
            Live Performance Metrics
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock,  label: 'Avg Latency',    value: `${metrics.avgLatencyMs}ms` },
              { icon: Zap,    label: 'Total Requests', value: metrics.totalRequests },
              { icon: Server, label: 'Tokens Used',    value: metrics.totalTokensUsed },
              { icon: Globe,  label: 'Cache Size',     value: metrics.cacheStats?.size || 0 },
              { icon: Zap,    label: 'Cache Hit Rate', value: `${metrics.cacheStats?.hitRate || 0}%` },
              { icon: Server, label: 'Hits / Misses',  value: `${metrics.cacheStats?.hits || 0} / ${metrics.cacheStats?.misses || 0}` },
            ].map(m => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="bg-brand-border rounded-xl p-3">
                  <Icon size={16} className="text-brand-muted mb-1" aria-hidden="true" />
                  <p className="text-xl font-bold">{m.value}</p>
                  <p className="text-xs text-brand-muted">{m.label}</p>
                </div>
              );
            })}
          </div>

          {Object.keys(metrics.languageBreakdown || {}).length > 0 && (
            <div>
              <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider mb-2">Languages Used</p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(metrics.languageBreakdown).map(([lang, count]) => (
                  <span key={lang} className="badge badge-green">{lang}: {count}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
