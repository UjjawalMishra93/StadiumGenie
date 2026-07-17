import React, { useState } from 'react';

const ZONE_COLORS = {
  safe:    { fill: '#10B981', stroke: '#059669', label: 'Comfortable', badgeClass: 'badge-green' },
  warning: { fill: '#F59E0B', stroke: '#D97706', label: 'Busy',        badgeClass: 'badge-yellow' },
  danger:  { fill: '#EF4444', stroke: '#DC2626', label: 'Crowded',     badgeClass: 'badge-red' },
};

function getZoneColor(pct) {
  if (pct < 70) return ZONE_COLORS.safe;
  if (pct < 85) return ZONE_COLORS.warning;
  return ZONE_COLORS.danger;
}

// Stadium zone shapes as SVG paths (simplified oval stadium, top-down view)
const STADIUM_ZONES = [
  {
    id: 'zone_north',
    label: 'North',
    path: 'M 200,60 A 120,55 0 0 1 400,60 L 380,100 A 100,35 0 0 0 220,100 Z',
  },
  {
    id: 'zone_south',
    label: 'South',
    path: 'M 220,300 A 100,35 0 0 0 380,300 L 400,340 A 120,55 0 0 1 200,340 Z',
  },
  {
    id: 'zone_east',
    label: 'East',
    path: 'M 380,100 A 100,35 0 0 0 380,300 L 420,310 A 135,55 0 0 0 420,90 Z',
  },
  {
    id: 'zone_west',
    label: 'West',
    path: 'M 220,100 A 100,35 0 0 1 220,300 L 180,310 A 135,55 0 0 1 180,90 Z',
  },
  {
    id: 'zone_upper_n',
    label: 'Upper N',
    path: 'M 180,90 A 135,55 0 0 1 420,90 L 400,60 A 120,55 0 0 0 200,60 Z',
  },
  {
    id: 'zone_upper_s',
    label: 'Upper S',
    path: 'M 420,310 A 135,55 0 0 1 180,310 L 200,340 A 120,55 0 0 0 400,340 Z',
  },
];

// Label positions for each zone
const LABEL_POS = {
  zone_north:   { x: 300, y: 82  },
  zone_south:   { x: 300, y: 320 },
  zone_east:    { x: 408, y: 202 },
  zone_west:    { x: 192, y: 202 },
  zone_upper_n: { x: 300, y: 76  },
  zone_upper_s: { x: 300, y: 326 },
};

export default function StadiumSVGMap({ zones }) {
  const [hoveredZone, setHoveredZone] = useState(null);

  if (!zones || zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full" />
      </div>
    );
  }

  // Build a lookup map: zoneId → status
  const zoneMap = {};
  zones.forEach(z => { zoneMap[z.zoneId] = z; });

  const hoveredStatus = hoveredZone ? zoneMap[hoveredZone] : null;
  const hoveredColor = hoveredStatus ? getZoneColor(hoveredStatus.occupancyPct) : null;

  return (
    <div className="relative">
      <svg
        viewBox="0 0 600 400"
        className="w-full max-h-56"
        role="img"
        aria-label="Stadium crowd map — top-down view of zone occupancy"
      >
        {/* Dark pitch background */}
        <ellipse cx="300" cy="200" rx="110" ry="88" fill="#0A2A14" stroke="#1A4228" strokeWidth="1.5" />
        {/* Pitch markings */}
        <ellipse cx="300" cy="200" rx="60" ry="48" fill="none" stroke="#1A4228" strokeWidth="1" />
        <line x1="300" y1="115" x2="300" y2="285" stroke="#1A4228" strokeWidth="1" />
        <circle cx="300" cy="200" r="5" fill="#1A4228" />

        {/* Zone sectors */}
        {STADIUM_ZONES.map(zone => {
          const status = zoneMap[zone.id];
          const pct = status?.occupancyPct ?? 50;
          const color = getZoneColor(pct);
          const opacity = 0.35 + (pct / 100) * 0.55; // denser = more opaque
          const isHovered = hoveredZone === zone.id;

          return (
            <g key={zone.id}>
              <path
                d={zone.path}
                fill={color.fill}
                fillOpacity={isHovered ? Math.min(opacity + 0.2, 1) : opacity}
                stroke={color.stroke}
                strokeWidth={isHovered ? 2.5 : 1.5}
                strokeOpacity={0.8}
                className="cursor-pointer transition-all duration-300"
                onMouseEnter={() => setHoveredZone(zone.id)}
                onMouseLeave={() => setHoveredZone(null)}
                onFocus={() => setHoveredZone(zone.id)}
                onBlur={() => setHoveredZone(null)}
                style={{ filter: isHovered ? `drop-shadow(0 0 6px ${color.fill})` : 'none' }}
                role="button"
                tabIndex={0}
                aria-label={`${zone.label} zone: ${pct}% capacity — ${color.label}`}
                onKeyDown={e => e.key === 'Enter' && setHoveredZone(zone.id === hoveredZone ? null : zone.id)}
              />
              {/* Pulsing dot for incident zones */}
              {status?.lastIncident && (
                <circle
                  cx={LABEL_POS[zone.id]?.x ?? 300}
                  cy={LABEL_POS[zone.id]?.y ?? 200}
                  r="5"
                  fill="#F59E0B"
                  opacity="0.9"
                  className="animate-pulse-slow"
                />
              )}
            </g>
          );
        })}

        {/* Zone % labels */}
        {STADIUM_ZONES.map(zone => {
          const status = zoneMap[zone.id];
          const pct = status?.occupancyPct ?? '?';
          const pos = LABEL_POS[zone.id];
          if (!pos) return null;
          return (
            <text
              key={`label-${zone.id}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="10"
              fontWeight="700"
              fillOpacity="0.95"
              style={{ pointerEvents: 'none', fontFamily: 'Inter, sans-serif' }}
            >
              {Math.round(pct)}%
            </text>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredStatus && hoveredColor && (
        <div className="absolute top-2 right-2 bg-brand-card border border-brand-border rounded-xl px-3 py-2 text-xs shadow-xl animate-fade-in pointer-events-none">
          <p className="font-bold text-sm">{hoveredStatus.name}</p>
          <p className={`${hoveredColor.badgeClass.replace('badge-','')} font-semibold`}>
            {hoveredStatus.occupancyPct}% — {hoveredColor.label}
          </p>
          {hoveredStatus.lastIncident && (
            <p className="text-amber-400 mt-1">⚠️ {hoveredStatus.lastIncident.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
