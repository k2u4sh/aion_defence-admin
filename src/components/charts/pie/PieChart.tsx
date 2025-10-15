"use client";
import React from "react";

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size?: number;
  strokeWidth?: number;
}

export default function PieChart({ data, size = 160, strokeWidth = 18 }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  let cumulative = 0;
  const circles = data.map((d, idx) => {
    const fraction = (d.value || 0) / total;
    const dashArray = 2 * Math.PI * radius;
    const dashOffset = dashArray * (1 - fraction);
    const rotate = (cumulative / total) * 360;
    cumulative += d.value || 0;
    const percent = Math.round(fraction * 100);
    return (
      <g key={idx}>
        <title>{`${d.label}: ${d.value} (${percent}%)`}</title>
        <circle
          r={radius}
          cx={center}
          cy={center}
          fill="transparent"
          stroke={d.color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${dashArray} ${dashArray}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center}) rotate(${rotate} ${center} ${center})`}
          strokeLinecap="butt"
        />
      </g>
    );
  });

  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Donut background */}
        <circle r={radius} cx={center} cy={center} fill="transparent" stroke="#e5e7eb" strokeWidth={strokeWidth} />
        {circles}
        {/* Inner hole for donut */}
        <circle r={radius - strokeWidth} cx={center} cy={center} fill="#ffffff" className="dark:fill-gray-900" />
        {/* Center label: total */}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="fill-gray-800 dark:fill-white" fontSize={12}>
          {total}
        </text>
      </svg>
      <div className="space-y-1">
        {data.map((d, idx) => {
          const pct = Math.round(((d.value || 0) / total) * 100);
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
              <span className="text-gray-700 dark:text-gray-300">
                {d.label}: <span className="font-medium">{d.value}</span> ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


