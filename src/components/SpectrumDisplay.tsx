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
  levels: number[];
  live: boolean;
  source: string;
}

const W = 1000;
const H = 420;

const SpectrumDisplay = ({ zoom, startFreq, span, levels, live, source }: SpectrumDisplayProps) => {
  const points = levels.length || 1;

  const path = useMemo(() => {
    if (!levels.length) return '';
    return levels
      .map((db, i) => {
        const x = (i / (points - 1)) * W;
        const v = Math.max(0, Math.min(1, (db + 100) / 100));
        const y = H - v * (H - 30) - 10;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [levels, points]);

  const fillPath = path ? `${path} L${W},${H} L0,${H} Z` : '';

  const markers = useMemo<Marker[]>(() => {
    if (!levels.length) return [];
    const indexed = levels.map((db, i) => ({ db, i }));
    const top = [...indexed].sort((a, b) => b.db - a.db).slice(0, 2);
    const colors = ['hsl(28 95% 55%)', 'hsl(195 90% 60%)'];
    return top.map((p, k) => ({
      id: k + 1,
      freq: Math.round(startFreq + (p.i / (points - 1)) * span),
      power: Number(p.db.toFixed(1)),
      color: colors[k],
    }));
  }, [levels, startFreq, span, points]);

  const freqLabels = Array.from({ length: 6 }, (_, i) => (startFreq + (span / 5) * i).toFixed(0));
  const dbLabels = ['0', '-20', '-40', '-60', '-80', '-100'];

  return (
    <div className="relative rounded-md border border-border bg-[hsl(200_22%_6%)] overflow-hidden scanline">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/40">
        <div className="flex items-center gap-2 font-mono text-xs text-primary text-glow">
          <span className={`h-2 w-2 rounded-full bg-primary ${live ? 'animate-flicker' : 'opacity-40'}`} />
          {live ? 'REAL-TIME SWEEP' : 'PAUSED'}
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          {source === 'device' ? 'USB DEVICE' : 'SIM'} · RBW 100 kHz · ZOOM {zoom.toFixed(1)}x
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

          {fillPath && <path d={fillPath} fill="url(#sigFill)" />}
          {path && (
            <path
              d={path}
              fill="none"
              stroke="hsl(152 95% 50%)"
              strokeWidth="2"
              strokeLinejoin="round"
              className="signal-glow"
            />
          )}

          {markers.map((m) => {
            const x = ((m.freq - startFreq) / span) * W;
            if (x < 0 || x > W) return null;
            const v = Math.max(0, Math.min(1, (m.power + 100) / 100));
            const y = H - v * (H - 30) - 10;
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
