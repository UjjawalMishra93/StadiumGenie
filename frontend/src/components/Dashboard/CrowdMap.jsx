import React from 'react';
import StadiumSVGMap from './StadiumSVGMap';

const ZONE_COLORS = {
  safe:    { bg: '#10B981', label: 'Comfortable', badgeClass: 'badge-green' },
  warning: { bg: '#F59E0B', label: 'Busy',        badgeClass: 'badge-yellow' },
  danger:  { bg: '#EF4444', label: 'Crowded',     badgeClass: 'badge-red' },
};

function getZoneColor(pct) {
  if (pct < 70) return ZONE_COLORS.safe;
  if (pct < 85) return ZONE_COLORS.warning;
  return ZONE_COLORS.danger;
}

function ZoneBar({ zone }) {
  const color = getZoneColor(zone.occupancyPct);
  return (
    <div className="space-y-1.5" role="listitem">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white truncate">{zone.name}</span>
        <span className={`badge ${color.badgeClass} ml-2 flex-shrink-0`}>
          {zone.occupancyPct}% — {color.label}
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-brand-border rounded-full overflow-hidden" role="progressbar"
        aria-valuenow={zone.occupancyPct} aria-valuemin={0} aria-valuemax={100}
        aria-label={`${zone.name} occupancy: ${zone.occupancyPct}%`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${zone.occupancyPct}%`, backgroundColor: color.bg }}
        />
      </div>
      {zone.lastIncident && (
        <p className="text-xs text-amber-400 flex items-center gap-1">
          <span aria-hidden="true">⚠️</span>
          {zone.lastIncident.message}
        </p>
      )}
    </div>
  );
}

export default function CrowdMap({ zones, aiSummary, simulated }) {
  if (!zones || zones.length === 0) {
    return (
      <div className="card p-5 flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full" aria-label="Loading crowd data" />
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg">Live Crowd Map</h2>
          <p className="text-xs text-brand-muted mt-0.5">AT&T Stadium · Match Day</p>
        </div>
        {simulated && (
          <span className="badge badge-yellow flex-shrink-0">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-slow" aria-hidden="true" />
            Simulated Data
          </span>
        )}
      </div>

      {/* SVG Stadium Map */}
      <StadiumSVGMap zones={zones} />

      {/* AI Summary */}
      {aiSummary?.text && (
        <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-3 flex gap-2">
          <span aria-hidden="true" className="text-lg">🤖</span>
          <div>
            <p className="text-xs font-semibold text-blue-400 mb-0.5">AI Insight</p>
            <p className="text-sm text-white leading-relaxed">{aiSummary.text}</p>
          </div>
        </div>
      )}

      {/* Zone bars */}
      <div className="space-y-4" role="list" aria-label="Zone occupancy levels">
        {zones.map(zone => (
          <ZoneBar key={zone.zoneId} zone={zone} />
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-brand-muted pt-1">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />Comfortable (&lt;70%)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" aria-hidden="true" />Busy (70–85%)</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />Crowded (&gt;85%)</span>
      </div>
    </div>
  );
}
