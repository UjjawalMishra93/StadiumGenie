import React from 'react';
import CrowdMap from '../components/Dashboard/CrowdMap';
import RequestsTable from '../components/Ops/RequestsTable';
import BroadcastBox from '../components/Ops/BroadcastBox';
import { useDashboard } from '../hooks/useDashboard';
import { Shield } from 'lucide-react';

export default function OpsConsole() {
  const { data: dashboard } = useDashboard();

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="card p-4 flex items-center gap-3 border-l-4 border-brand-red">
        <Shield size={24} className="text-brand-red flex-shrink-0" aria-hidden="true" />
        <div>
          <h2 className="font-bold text-base">Ops Console — Staff View</h2>
          <p className="text-xs text-brand-muted">AT&T Stadium · FIFA World Cup 2026 · Match Day Operations</p>
        </div>
        <span className="badge badge-green ml-auto flex-shrink-0">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-slow" aria-hidden="true" />
          Live
        </span>
      </div>

      {/* Live Crowd */}
      <CrowdMap
        zones={dashboard?.zones}
        aiSummary={dashboard?.aiSummary}
        simulated={dashboard?.simulated}
      />

      {/* Assistance Requests */}
      <RequestsTable />

      {/* Broadcast */}
      <BroadcastBox />
    </div>
  );
}
