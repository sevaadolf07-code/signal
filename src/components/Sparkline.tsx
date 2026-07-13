type Props = {
  values: number[];
  color: string;
  className?: string;
};

/** Tiny pure-SVG sparkline. No external chart library needed for the signal cards. */
export function Sparkline({ values, color, className }: Props) {
  if (values.length < 2) values = [1, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 120;
  const h = 40;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`);
  const line = "M " + pts.join(" L ");
  const area = `M 0,${h} L ${pts.join(" L ")} L ${w},${h} Z`;
  const uid = Math.random().toString(36).slice(2, 8);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${uid})`} />
      <path className="spark-path" d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - ((values[values.length - 1] - min) / range) * h} r="2.6" fill={color}>
        <animate attributeName="r" values="2.6;4;2.6" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.5;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}