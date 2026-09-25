interface Props {
  data: number[];
  width?: number;
  height?: number;
  /** Optional horizontal marker, e.g. the user's price. */
  marker?: number;
}

export default function Sparkline({ data, width = 320, height = 72, marker }: Props) {
  const values = marker !== undefined ? [...data, marker] : data;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || max * 0.001 || 1;
  const pad = 6;
  const x = (i: number) => (i / Math.max(data.length - 1, 1)) * width;
  const y = (v: number) => pad + (1 - (v - min) / range) * (height - pad * 2);
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? 'var(--green)' : 'var(--red)';
  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L${width},${height} L0,${height} Z`;
  const gid = up ? 'spark-up' : 'spark-down';

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" width="100%" height={height}>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      {marker !== undefined && (
        <line x1="0" x2={width} y1={y(marker)} y2={y(marker)} stroke="var(--brand)" strokeWidth="1.5" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
      )}
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="3.5" fill={stroke} />
    </svg>
  );
}
