import { Signal } from '@preact/signals';

interface SceneTabsProps {
  sceneConfigs: Signal<any[]>;
  activeIndex: Signal<number>;
  onSelect: (idx: number) => void;
  onAdd: () => void;
}

export function SceneTabs({ sceneConfigs, activeIndex, onSelect, onAdd }: SceneTabsProps) {
  return (
    <div className="tabs-header">
      {sceneConfigs.value.map((cfg, idx) => {
        const primarySlot = cfg?.slotSceneMap?.primary;
        const primaryScene = typeof primarySlot === 'string' ? primarySlot : primarySlot?.scene;
        const label = primaryScene ? `#${idx + 1} ${primaryScene}` : `Screenshot ${idx + 1}`;

        return (
          <button
            key={idx}
            className={`tab-btn ${activeIndex.value === idx ? 'active' : ''}`}
            onClick={() => onSelect(idx)}
          >
            {label}
          </button>
        );
      })}
      <div className="scene-management">
        <button className="btn-icon btn-add-scene" title="Add Screenshot Config" onClick={onAdd}>
          +
        </button>
      </div>
    </div>
  );
}
