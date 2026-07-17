import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const STATUS_CONFIG = {
  'open':        { cls: 'badge-red',    icon: AlertTriangle, label: 'Open' },
  'in-progress': { cls: 'badge-yellow', icon: Clock,         label: 'In Progress' },
  'resolved':    { cls: 'badge-green',  icon: CheckCircle,   label: 'Resolved' },
};

export default function RequestsTable() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assist`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch {
      // silently fail — no requests yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const id = setInterval(fetchRequests, 10000);
    return () => clearInterval(id);
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await fetch(`${API_BASE}/api/assist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchRequests();
    } catch {}
  };

  if (loading) return (
    <div className="card p-5 flex items-center justify-center h-32">
      <div className="animate-spin w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full" aria-label="Loading requests" />
    </div>
  );

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">Assistance Requests</h3>
        <button onClick={fetchRequests} className="text-brand-muted hover:text-white transition-colors" aria-label="Refresh requests">
          <RefreshCw size={16} aria-hidden="true" />
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8 text-brand-muted text-sm">
          <CheckCircle size={28} className="mx-auto mb-2 text-emerald-500" aria-hidden="true" />
          No open requests — all clear!
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Assistance requests">
          {requests.map(req => {
            const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG['open'];
            const Icon = cfg.icon;
            return (
              <div key={req.id} className="bg-brand-border rounded-xl p-4 space-y-2" role="listitem">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{req.category}</p>
                    <p className="text-xs text-brand-muted">{req.location}</p>
                  </div>
                  <span className={`badge ${cfg.cls} flex-shrink-0`}>
                    <Icon size={11} aria-hidden="true" />
                    {cfg.label}
                  </span>
                </div>

                {/* AI Staff Brief */}
                {req.staffBrief && (
                  <div className="bg-blue-900/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-400 font-semibold mb-0.5">🤖 Staff Brief</p>
                    <p className="text-xs text-white">{req.staffBrief}</p>
                  </div>
                )}

                {/* Status controls */}
                {req.status !== 'resolved' && (
                  <div className="flex gap-2 pt-1">
                    {req.status === 'open' && (
                      <button
                        onClick={() => updateStatus(req.id, 'in-progress')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                      >
                        Mark In Progress
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(req.id, 'resolved')}
                      className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    >
                      Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
