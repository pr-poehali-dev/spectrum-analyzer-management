import { useMemo } from 'react';
import Icon from '@/components/ui/icon';

interface Marker {
  id: number;
  freq: number;
  power: number;
  color: string;
}

interface SpectrumDisplayProps {
  zoom: number;
  startFreq: number;
  span: number;
}

const W = 1000;
const H = 420;

function generateSpectrum(points: number, seed: number): number[] {
  const data: number[] = [];
  const peaks = [
    { pos: 0.18, amp: 0.72, width: 0.012 },
    { pos: 0.34, amp: 0.55, width: 0.02 },
    { pos: 0.52, amp: 0.92, width: 0.008 },
    { pos: 0.68, amp: 0.4, width: 0.03 },
    { pos: 0.81, amp: 0.63, width: 0.015 },
  ];
  for (let i = 0; i < points; i++) {
    const x = i / points;
    let v = 0.08 + Math.sin(i * 0.7 + seed) * 0.015 + Math.random() * 0.04;
    for (const p of peaks) {
      v += p.amp * Math.exp(-Math.pow((x - p.pos) / p.width, 2));
    }
    data.push(Math.min(v, 1));
  }
  return data;
}

const markers: Marker[] = [
  { id: 1, freq: 1452, power: -18.4, color: 'hsl(28 95% 55%)' },
  { id: 2, freq: 2340, power: -42.1, color: 'hsl(195 90% 60%)' },
];

const SpectrumDisplay = ({ zoom, startFreq, span }: SpectrumDisplayProps) => {
  const points = 400;
  const spectrum = useMemo(() => generateSpectrum(points, 1.3), []);

  const path = useMemo(() => {
    return spectrum
      .map((v, i) => {
        const x = (i / (points - 1)) * W;
        const y = H - v * (H - 30) - 10;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [spectrum]);

  const fillPath = `${path} L${W},${H} L0,${H} Z`;

  const freqLabels = Array.from({ length: 6 }, (_, i) =>
    (startFreq + (span / 5) * i).toFixed(0),
  );
  const dbLabels = ['0', '-20', '-40', '-60', '-80', '-100'];

  return (
    <div className="relative rounded-md border border-border bg-[hsl(200_22%_6%)] overflow-hidden scanline">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 font-mono text-xs text-primary text-glow">
          <span className="h-2 w-2 rounded-full bg-primary animate-flicker" />
          REAL-TIME SWEEP
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          RBW 100 kHz · VBW 30 kHz · ZOOM {zoom.toFixed(1)}x
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full block" preserveAspectRatio="none" style={{ height: 'clamp(280px, 42vh, 460px)' }}>
          <defs>
            <linearGradient id="sigFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(152 95% 50%)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(152 95% 50%)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {dbLabels.map((_, i) => {
            const y = (H / 5) * i;
            return <line key={`h${i}`} x1="0" y1={y} x2={W} y2={y} stroke="hsl(195 20% 22%)" strokeWidth="1" strokeOpacity="0.5" />;
          })}
          {freqLabels.map((_, i) => {
            const x = (W / 5) * i;
            return <line key={`v${i}`} x1={x} y1="0" x2={x} y2={H} stroke="hsl(195 20% 22%)" strokeWidth="1" strokeOpacity="0.5" />;
          })}

          <path d={fillPath} fill="url(#sigFill)" />
          <path d={path} fill="none" stroke="hsl(152 95% 50%)" strokeWidth="2" className="signal-glow" />

          {markers.map((m) => {
            const x = ((m.freq - startFreq) / span) * W;
            if (x < 0 || x > W) return null;
            const y = H - ((m.power + 100) / 100) * H;
            return (
              <g key={m.id}>
                <line x1={x} y1="0" x2={x} y2={H} stroke={m.color} strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.7" />
                <polygon points={`${x - 7},${y - 14} ${x + 7},${y - 14} ${x},${y - 2}`} fill={m.color} />
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-1 pl-2 font-mono text-[10px] text-muted-foreground">
          {dbLabels.map((d) => (
            <span key={d}>{d} dBm</span>
          ))}
        </div>
      </div>

      <div className="flex justify-between px-3 pb-2 pt-1 font-mono text-[10px] text-muted-foreground border-t border-border">
        {freqLabels.map((f, i) => (
          <span key={i}>{f} MHz</span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-px bg-border border-t border-border">
        {markers.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 bg-card px-4 py-2">
            <div className="flex items-center gap-2">
              <Icon name="LocateFixed" size={14} style={{ color: m.color }} />
              <span className="font-mono text-xs text-muted-foreground">MKR {m.id}</span>
            </div>
            <div className="font-mono text-sm" style={{ color: m.color }}>
              {m.freq} MHz · {m.power} dBm
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpectrumDisplay;
