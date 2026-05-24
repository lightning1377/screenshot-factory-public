import type { Signal } from '@preact/signals';
import type { AppStats } from '../types';

interface PreviewStatsProps {
  stats: Signal<AppStats | null>;
}

const STAT_ITEMS: Array<{ label: string; key: keyof AppStats }> = [
  { label: 'Apps', key: 'totalApps' },
  { label: 'Screenshots', key: 'totalScreenshots' },
  { label: 'Languages', key: 'totalLocales' },
  { label: 'Scenes', key: 'totalScenes' },
];

export function PreviewStats({ stats }: PreviewStatsProps) {
  const current = stats.value;

  return (
    <>
      {STAT_ITEMS.map((item) => (
        <div className="stat-card" key={item.key}>
          <div className="stat-value">{current?.[item.key] ?? 0}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </>
  );
}
