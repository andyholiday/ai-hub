// =============================================================================
// Radar Chart - SVG-based Innovation Radar Visualization
// 4 concentric rings (Adopt, Trial, Assess, Hold) x 4 quadrants
// =============================================================================

"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type {
  RadarCategory,
  RadarRing,
} from "@/lib/validators/innovation-radar";
import {
  CATEGORY_LABELS,
  RING_LABELS,
} from "@/lib/validators/innovation-radar";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RadarItem {
  id: string;
  title: string;
  description: string;
  category: RadarCategory;
  ring: RadarRing;
  votes_count: number;
  isVotedByUser: boolean;
}

interface RadarChartProps {
  items: RadarItem[];
  selectedItemId: string | null;
  highlightCategory: RadarCategory | null;
  onItemClick: (item: RadarItem) => void;
  onItemHover: (item: RadarItem | null) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RING_ORDER: RadarRing[] = ["adopt", "trial", "assess", "hold"];

const RING_COLORS: Record<RadarRing, { fill: string; stroke: string; label: string }> = {
  adopt: { fill: "#E6F7ED", stroke: "#00A651", label: "#006837" },
  trial: { fill: "#E3F2FD", stroke: "#42A5F5", label: "#1565C0" },
  assess: { fill: "#FFF8E1", stroke: "#FFA726", label: "#E65100" },
  hold: { fill: "#FFEBEE", stroke: "#EF5350", label: "#C62828" },
};

const CATEGORY_COLORS: Record<RadarCategory, string> = {
  techniques: "#00A651",
  tools: "#42A5F5",
  platforms: "#C7A84E",
  frameworks: "#7C3AED",
};

const QUADRANT_ORDER: RadarCategory[] = [
  "techniques",
  "tools",
  "platforms",
  "frameworks",
];

// SVG dimensions
const SVG_SIZE = 600;
const CENTER = SVG_SIZE / 2;
const MAX_RADIUS = 270;
const MIN_RADIUS = 60;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get the radius range for a ring (from center outward) */
function getRingRadii(ring: RadarRing): { inner: number; outer: number } {
  const ringIndex = RING_ORDER.indexOf(ring);
  const ringWidth = (MAX_RADIUS - MIN_RADIUS) / 4;
  const inner = MIN_RADIUS + ringIndex * ringWidth;
  const outer = inner + ringWidth;
  return { inner, outer };
}

/** Get the angle range for a quadrant (in radians) */
function getQuadrantAngles(category: RadarCategory): {
  startAngle: number;
  endAngle: number;
} {
  const quadrantIndex = QUADRANT_ORDER.indexOf(category);
  const startAngle = (quadrantIndex * Math.PI) / 2 - Math.PI / 2;
  const endAngle = startAngle + Math.PI / 2;
  return { startAngle, endAngle };
}

/** Deterministic pseudo-random value from string (for consistent positioning) */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Calculate x, y position for an item on the radar */
function getItemPosition(item: RadarItem): { x: number; y: number } {
  const { inner, outer } = getRingRadii(item.ring);
  const { startAngle, endAngle } = getQuadrantAngles(item.category);

  // Use deterministic hash for consistent placement
  const hash = hashString(item.id);
  const radiusFraction = 0.2 + (hash % 60) / 100; // 0.2 - 0.8
  const angleFraction = 0.15 + ((hash >> 8) % 70) / 100; // 0.15 - 0.85

  const radius = inner + (outer - inner) * radiusFraction;
  const angle = startAngle + (endAngle - startAngle) * angleFraction;

  return {
    x: CENTER + radius * Math.cos(angle),
    y: CENTER + radius * Math.sin(angle),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Concentric ring arcs */
function RingCircles() {
  return (
    <>
      {[...RING_ORDER].reverse().map((ring) => {
        const { outer } = getRingRadii(ring);
        const colors = RING_COLORS[ring];
        return (
          <circle
            key={ring}
            cx={CENTER}
            cy={CENTER}
            r={outer}
            fill={colors.fill}
            stroke={colors.stroke}
            strokeWidth={1}
            strokeOpacity={0.3}
          />
        );
      })}
    </>
  );
}

/** Quadrant divider lines */
function QuadrantLines() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * Math.PI) / 2 - Math.PI / 2;
        const x2 = CENTER + MAX_RADIUS * Math.cos(angle);
        const y2 = CENTER + MAX_RADIUS * Math.sin(angle);
        return (
          <line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={x2}
            y2={y2}
            stroke="#E0E0E0"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        );
      })}
    </>
  );
}

/** Ring labels (Adopt, Trial, Assess, Hold) */
function RingLabels() {
  return (
    <>
      {RING_ORDER.map((ring) => {
        const { inner, outer } = getRingRadii(ring);
        const midRadius = (inner + outer) / 2;
        const colors = RING_COLORS[ring];
        return (
          <text
            key={ring}
            x={CENTER}
            y={CENTER - midRadius}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={colors.label}
            fontSize={11}
            fontWeight={600}
            opacity={0.6}
          >
            {RING_LABELS[ring]}
          </text>
        );
      })}
    </>
  );
}

/** Quadrant labels */
function QuadrantLabels() {
  const labelPositions = [
    { category: "techniques" as RadarCategory, x: CENTER + 70, y: 30 },
    { category: "tools" as RadarCategory, x: SVG_SIZE - 30, y: CENTER + 18 },
    { category: "platforms" as RadarCategory, x: CENTER + 70, y: SVG_SIZE - 16 },
    { category: "frameworks" as RadarCategory, x: 30, y: CENTER + 18 },
  ];

  return (
    <>
      {labelPositions.map(({ category, x, y }) => (
        <text
          key={category}
          x={x}
          y={y}
          textAnchor={x < CENTER ? "start" : x > CENTER + 100 ? "end" : "start"}
          fill={CATEGORY_COLORS[category]}
          fontSize={13}
          fontWeight={700}
          opacity={0.8}
        >
          {CATEGORY_LABELS[category]}
        </text>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Tooltip Component
// ---------------------------------------------------------------------------

interface RadarTooltipProps {
  item: RadarItem;
  x: number;
  y: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function RadarTooltip({ item, x, y, containerRef }: RadarTooltipProps) {
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const svgWidth = rect.width;
    const scale = svgWidth / SVG_SIZE;

    let left = x * scale;
    let top = y * scale - 70;

    // Keep tooltip within bounds
    if (left + 150 > svgWidth) left = svgWidth - 160;
    if (left < 10) left = 10;
    if (top < 10) top = y * scale + 20;

    setPosition({ left, top });
  }, [x, y, containerRef]);

  return (
    <div
      className="pointer-events-none absolute z-tooltip animate-fade-in"
      style={{ left: position.left, top: position.top }}
    >
      <div className="rounded-xl bg-surface-800/95 px-3.5 py-2.5 shadow-elevated backdrop-blur-md">
        <p className="text-body-sm font-semibold text-white">{item.title}</p>
        <p className="mt-0.5 max-w-[200px] text-caption text-surface-300 line-clamp-2">
          {item.description}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: CATEGORY_COLORS[item.category] }}
          />
          <span className="text-overline uppercase text-surface-400">
            {RING_LABELS[item.ring]}
          </span>
          <span className="text-overline text-surface-400">
            {item.votes_count} Votes
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Radar Chart Component
// ---------------------------------------------------------------------------

export function RadarChart({
  items,
  selectedItemId,
  highlightCategory,
  onItemClick,
  onItemHover,
}: RadarChartProps) {
  const [hoveredItem, setHoveredItem] = useState<RadarItem | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleItemHover = useCallback(
    (item: RadarItem | null, x?: number, y?: number) => {
      setHoveredItem(item);
      if (x !== undefined && y !== undefined) {
        setHoveredPos({ x, y });
      }
      onItemHover(item);
    },
    [onItemHover],
  );

  // Calculate positions for all items
  const itemPositions = useMemo(() => {
    return items.map((item) => ({
      item,
      ...getItemPosition(item),
    }));
  }, [items]);

  // Dot size based on votes (normalized)
  const maxVotes = useMemo(
    () => Math.max(1, ...items.map((i) => i.votes_count)),
    [items],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        className="h-auto w-full"
        role="img"
        aria-label="Innovation Radar Visualization"
      >
        {/* Background rings */}
        <RingCircles />

        {/* Quadrant divider lines */}
        <QuadrantLines />

        {/* Center dot */}
        <circle cx={CENTER} cy={CENTER} r={4} fill="#9E9E9E" opacity={0.4} />

        {/* Ring labels */}
        <RingLabels />

        {/* Quadrant labels */}
        <QuadrantLabels />

        {/* Items as dots */}
        {itemPositions.map(({ item, x, y }) => {
          const isSelected = selectedItemId === item.id;
          const isHighlighted =
            !highlightCategory || highlightCategory === item.category;
          const baseSize = 5 + (item.votes_count / maxVotes) * 6;
          const size = isSelected ? baseSize + 3 : baseSize;

          return (
            <g
              key={item.id}
              className="cursor-pointer"
              onClick={() => onItemClick(item)}
              onMouseEnter={() => handleItemHover(item, x, y)}
              onMouseLeave={() => handleItemHover(null)}
              role="button"
              tabIndex={0}
              aria-label={`${item.title} - ${RING_LABELS[item.ring]} - ${CATEGORY_LABELS[item.category]}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onItemClick(item);
                }
              }}
            >
              {/* Glow effect for selected */}
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r={size + 4}
                  fill={CATEGORY_COLORS[item.category]}
                  opacity={0.2}
                  className="animate-pulse-soft"
                />
              )}

              {/* Main dot */}
              <circle
                cx={x}
                cy={y}
                r={size}
                fill={CATEGORY_COLORS[item.category]}
                opacity={isHighlighted ? 1 : 0.2}
                stroke={isSelected ? "#fff" : "transparent"}
                strokeWidth={isSelected ? 2 : 0}
                className="transition-all duration-200"
              />

              {/* Vote indicator ring */}
              {item.isVotedByUser && (
                <circle
                  cx={x}
                  cy={y}
                  r={size + 2}
                  fill="none"
                  stroke={CATEGORY_COLORS[item.category]}
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  opacity={isHighlighted ? 0.6 : 0.15}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip overlay */}
      {hoveredItem && (
        <RadarTooltip
          item={hoveredItem}
          x={hoveredPos.x}
          y={hoveredPos.y}
          containerRef={containerRef}
        />
      )}
    </div>
  );
}
