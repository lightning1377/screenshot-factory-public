import { useRef, useEffect } from 'preact/hooks';
import { Signal } from '@preact/signals';
import Sortable from 'sortablejs';
import { SceneConfig } from '../types';

interface ScreenshotSorterProps {
  sceneConfigs: Signal<SceneConfig[]>;
  uploadOrder: Signal<string[]>;
  onUpdateOrder: (order: string[]) => void;
}

export function ScreenshotSorter({
  sceneConfigs,
  uploadOrder,
  onUpdateOrder,
}: ScreenshotSorterProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const sortableRef = useRef<Sortable | null>(null);

  // Combinations are sceneIndex:theme
  const combinations: { id: string; label: string }[] = [];
  sceneConfigs.value.forEach((sc, idx) => {
    const themes = sc.themes || ['light'];

    // Find primary scene (logic from SceneTabs)
    const primarySlot = sc?.slotSceneMap?.primary;
    const primaryScene =
      typeof primarySlot === 'string' ? primarySlot : (primarySlot as any)?.scene;
    const sceneLabel = primaryScene || `Scene ${idx + 1}`;

    themes.forEach((theme) => {
      combinations.push({
        id: `${idx}:${theme}`,
        label: `${sceneLabel} (${theme})`,
      });
    });
  });

  // Filter out combinations that no longer exist, and add new ones
  const currentOrder = uploadOrder.value.filter((id) => combinations.some((c) => c.id === id));
  combinations.forEach((c) => {
    if (!currentOrder.includes(c.id)) {
      currentOrder.push(c.id);
    }
  });

  useEffect(() => {
    if (listRef.current && !sortableRef.current) {
      sortableRef.current = new Sortable(listRef.current, {
        animation: 150,
        handle: '.drag-handle',
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
          const { oldIndex, newIndex } = evt;
          if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return;

          const nextOrder = [...currentOrder];
          const [movedItem] = nextOrder.splice(oldIndex, 1);
          nextOrder.splice(newIndex, 0, movedItem);
          onUpdateOrder(nextOrder);
        },
      });
    }

    return () => {
      if (sortableRef.current) {
        sortableRef.current.destroy();
        sortableRef.current = null;
      }
    };
  }, [currentOrder]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const nextOrder = [...currentOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= nextOrder.length) return;

    [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
    onUpdateOrder(nextOrder);
  };

  const handleReset = () => {
    const defaultOrder = combinations.map((c) => c.id);
    onUpdateOrder(defaultOrder);
  };

  return (
    <div style="margin-top: 2rem">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem">
        <label>Screenshot Upload Order</label>
        <button
          class="secondary"
          style="padding: 0.4rem 0.8rem; font-size: 0.8rem"
          onClick={handleReset}
        >
          Reset to Default
        </button>
      </div>

      <div class="panel" style="padding: 1rem; background: var(--bg)">
        {currentOrder.length === 0 && <div class="status">No screenshots to order.</div>}
        <div ref={listRef} style="display: flex; flex-direction: column; gap: 0.5rem">
          {currentOrder.map((id, index) => {
            const combo = combinations.find((c) => c.id === id);
            if (!combo) return null;

            return (
              <div
                key={id}
                data-id={id}
                style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--card-bg); border-radius: 0.5rem; border: 1px solid var(--border); cursor: default"
              >
                <div style="display: flex; align-items: center; gap: 0.75rem">
                  <div
                    class="drag-handle"
                    style="cursor: grab; color: var(--text-muted); display: flex; align-items: center"
                  >
                    <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor">
                      <circle cx="3" cy="3" r="1.5" />
                      <circle cx="3" cy="9" r="1.5" />
                      <circle cx="3" cy="15" r="1.5" />
                      <circle cx="9" cy="3" r="1.5" />
                      <circle cx="9" cy="9" r="1.5" />
                      <circle cx="9" cy="15" r="1.5" />
                    </svg>
                  </div>
                  <div style="font-size: 0.9rem; font-weight: 500">{combo.label}</div>
                </div>

                <div class="button-group" style="gap: 0.4rem">
                  <button
                    class="secondary btn-icon"
                    style="padding: 0.3rem; min-width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    title="Move Up"
                  >
                    ↑
                  </button>
                  <button
                    class="secondary btn-icon"
                    style="padding: 0.3rem; min-width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === currentOrder.length - 1}
                    title="Move Down"
                  >
                    ↓
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .sortable-ghost {
          opacity: 0.4;
          background: var(--bg-hover) !important;
          border: 1px dashed var(--primary) !important;
        }
        .drag-handle:active {
          cursor: grabbing !important;
        }
      `}</style>
    </div>
  );
}
