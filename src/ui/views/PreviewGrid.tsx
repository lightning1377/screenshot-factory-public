import type { Signal } from '@preact/signals';

export interface PreviewGridCard {
  id: string;
  label: string;
  subtitle?: string;
  url: string;
  width: number;
  height: number;
  scaledWidth: number;
  scaledHeight: number;
  scale: number;
}

interface PreviewGridProps {
  cards: Signal<PreviewGridCard[]>;
}

export function PreviewGrid({ cards }: PreviewGridProps) {
  return (
    <>
      {cards.value.map((card) => (
        <div className="preview-card" key={card.id}>
          <div className="preview-card-title">{card.label}</div>
          {card.subtitle ? <div className="preview-card-subtitle">{card.subtitle}</div> : null}

          <div
            className="preview-frame-holder"
            style={{ width: `${card.scaledWidth}px`, height: `${card.scaledHeight}px` }}
          >
            <iframe
              loading="lazy"
              src={card.url}
              style={{
                width: `${card.width}px`,
                height: `${card.height}px`,
                transform: `scale(${card.scale})`,
                transformOrigin: 'top left',
              }}
            />
          </div>
        </div>
      ))}
    </>
  );
}
