import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import SpectrumDisplay from '@/components/SpectrumDisplay';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

const SPECTRUM_URL = 'https://functions.poehali.dev/671479c7-4803-4616-9201-be694bdd7c2e';

interface SpectrumData {
  start_freq: number;
  span: number;
  unit: string;
  levels: number[];
  source: string;
}

const navItems = [
  { id: 'measure', label: 'Измерения', icon: 'Activity' },
  { id: 'charts', label: 'Графики', icon: 'LineChart' },
  { id: 'settings', label: 'Настройки', icon: 'SlidersHorizontal' },
  { id: 'history', label: 'История', icon: 'History' },
  { id: 'export', label: 'Экспорт', icon: 'Download' },
  { id: 'calibration', label: 'Калибровка', icon: 'Crosshair' },
];

const Index = () => {
  const [active, setActive] = useState('measure');
  const [zoom, setZoom] = useState([2]);
  const [running, setRunning] = useState(true);
  const [data, setData] = useState<SpectrumData | null>(null);
  const [connected, setConnected] = useState(false);
  const runningRef = useRef(running);
  runningRef.current = running;

  useEffect(() => {
    let stop = false;
    const poll = async () => {
      if (!stop && runningRef.current) {
        try {
          const res = await fetch(SPECTRUM_URL);
          const json = await res.json();
          setData(json);
          setConnected(true);
        } catch {
          setConnected(false);
        }
      }
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  const baseStart = data?.start_freq ?? 900;
  const baseSpan = data?.span ?? 2100;
  const span = baseSpan / zoom[0];
  const startFreq = baseStart + (baseSpan - span) / 2;

  const levels = data?.levels ?? [];
  const visible = (() => {
    if (!levels.length) return [];
    const from = Math.floor(((startFreq - baseStart) / baseSpan) * levels.length);
    const count = Math.max(2, Math.round(levels.length / zoom[0]));
    return levels.slice(Math.max(0, from), Math.max(2, from + count));
  })();

  const peak = levels.length ? Math.max(...levels) : 0;
  const floor = levels.length ? Math.min(...levels) : 0;
  const isDevice = data?.source === 'device';

  return (
    <div className="min-h-screen grid-bg text-foreground flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-sidebar border-r border-sidebar-border flex lg:flex-col shrink-0">
        <div className="p-5 border-b border-sidebar-border hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded bg-primary/15 border border-primary/40 flex items-center justify-center">
              <Icon name="Radio" size={20} className="text-primary" />
            </div>
            <div>
              <div className="font-display font-bold text-lg tracking-wide leading-none text-foreground">
                SPECTRA-X
              </div>
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest">
                ANALYZER · v2.4
              </div>
            </div>
          </div>
        </div>

        <nav className="flex lg:flex-col gap-1 p-2 lg:p-3 overflow-x-auto w-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                active === item.id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-4 hidden lg:block border-t border-sidebar-border">
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`h-2 w-2 rounded-full ${connected ? 'bg-primary animate-flicker' : 'bg-destructive'}`} />
            <span className="text-muted-foreground">{isDevice ? 'USB' : 'СИМ'}</span>
            <span className={`ml-auto ${connected ? 'text-primary' : 'text-destructive'}`}>
              {connected ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6 animate-fade-in">
          <div>
            <h1 className="font-display font-bold text-3xl lg:text-4xl tracking-wide uppercase text-glow">
              Анализатор спектра
            </h1>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              SWEEP MODE · CONTINUOUS · DET: PEAK · {isDevice ? 'USB DEVICE' : 'SIMULATION'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setRunning((r) => !r)}
              className={`font-mono uppercase tracking-wide ${
                running
                  ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              }`}
            >
              <Icon name={running ? 'Square' : 'Play'} size={16} className="mr-1" />
              {running ? 'STOP' : 'RUN'}
            </Button>
            <Button variant="outline" className="font-mono uppercase tracking-wide border-border">
              <Icon name="Save" size={16} className="mr-1" />
              Trace
            </Button>
          </div>
        </header>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-md overflow-hidden border border-border mb-6 animate-fade-in">
          {[
            { label: 'CENTER', value: `${(startFreq + span / 2).toFixed(0)}`, unit: 'MHz' },
            { label: 'SPAN', value: span.toFixed(0), unit: 'MHz' },
            { label: 'PEAK', value: peak.toFixed(1), unit: 'dBm' },
            { label: 'NOISE FLOOR', value: floor.toFixed(1), unit: 'dBm' },
          ].map((s) => (
            <div key={s.label} className="bg-card px-4 py-3">
              <div className="font-mono text-[10px] text-muted-foreground tracking-widest">{s.label}</div>
              <div className="font-mono text-xl text-primary mt-0.5">
                {s.value}
                <span className="text-xs text-muted-foreground ml-1">{s.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Spectrum */}
        <div className="animate-fade-in">
          <SpectrumDisplay
            zoom={zoom[0]}
            startFreq={startFreq}
            span={span}
            levels={visible}
            live={running && connected}
            source={data?.source ?? 'simulation'}
          />
        </div>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-4 mt-6 animate-fade-in">
          <div className="md:col-span-2 rounded-md border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-display uppercase tracking-wide text-sm flex items-center gap-2">
                <Icon name="ZoomIn" size={16} className="text-primary" />
                Масштаб частотной оси
              </span>
              <span className="font-mono text-primary text-glow">{zoom[0].toFixed(1)}×</span>
            </div>
            <Slider value={zoom} onValueChange={setZoom} min={1} max={10} step={0.5} />
            <div className="flex justify-between mt-2 font-mono text-[10px] text-muted-foreground">
              <span>{baseStart.toFixed(0)} MHz</span>
              <span>WIDE</span>
              <span>NARROW</span>
              <span>{(baseStart + baseSpan).toFixed(0)} MHz</span>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card p-5">
            <span className="font-display uppercase tracking-wide text-sm flex items-center gap-2 mb-4">
              <Icon name="Gauge" size={16} className="text-accent" />
              Состояние
            </span>
            <div className="space-y-2 font-mono text-xs">
              {[
                ['Источник', isDevice ? 'USB прибор' : 'Симуляция', 'text-primary'],
                ['Связь', connected ? 'Активна' : 'Нет', connected ? 'text-primary' : 'text-destructive'],
                ['Точек', String(levels.length), 'text-foreground'],
                ['Опрос', '1 сек', 'text-foreground'],
              ].map(([k, v, c]) => (
                <div key={k} className="flex justify-between border-b border-border/50 pb-1.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className={c}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
