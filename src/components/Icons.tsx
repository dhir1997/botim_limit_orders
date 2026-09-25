// Small inline SVG icon set (stroke icons, inherit currentColor).

interface P { size?: number; className?: string }

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const ChevronLeft = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M15 18l-6-6 6-6" /></svg>
);
export const ChevronRight = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M9 18l6-6-6-6" /></svg>
);
export const Bell = ({ size }: P) => (
  <svg {...base(size)}><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
);
export const Target = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" /></svg>
);
export const Check = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={3}><path d="M20 6L9 17l-5-5" /></svg>
);
export const Close = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M18 6L6 18M6 6l12 12" /></svg>
);
export const Alert = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
);
export const Clock = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const Wallet = ({ size }: P) => (
  <svg {...base(size)}><path d="M20 7H5a2 2 0 010-4h13v4" /><path d="M3 5v14a2 2 0 002 2h15V7" /><circle cx="16" cy="14" r="1.3" fill="currentColor" /></svg>
);
export const Card = ({ size }: P) => (
  <svg {...base(size)}><rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20M6 15h4" /></svg>
);
export const ArrowDown = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
);
export const ArrowUp = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
export const Chart = ({ size }: P) => (
  <svg {...base(size)}><path d="M3 3v18h18" /><path d="M7 14l4-4 4 3 5-6" /></svg>
);
export const Pie = ({ size }: P) => (
  <svg {...base(size)}><path d="M21.2 15.9A10 10 0 118 2.8" /><path d="M22 12A10 10 0 0012 2v10z" /></svg>
);
export const Inbox = ({ size }: P) => (
  <svg {...base(size)}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /></svg>
);
export const Minus = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M5 12h14" /></svg>
);
export const Plus = ({ size }: P) => (
  <svg {...base(size)} strokeWidth={2.5}><path d="M12 5v14M5 12h14" /></svg>
);
export const Shield = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
);
export const Refresh = ({ size }: P) => (
  <svg {...base(size)}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15" /></svg>
);
