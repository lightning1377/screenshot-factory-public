import type { Signal } from '@preact/signals';
import { useCallback, useEffect, useRef } from 'preact/hooks';
import { PreviewGrid, type PreviewGridCard } from './PreviewGrid';

type WorkspaceMode = 'empty' | 'single' | 'all';

interface SinglePreviewData {
  url: string;
  width: number;
  height: number;
}

interface PreviewWorkspaceProps {
  mode: Signal<WorkspaceMode>;
  zoom: Signal<number>;
  cards: Signal<PreviewGridCard[]>;
  singlePreview: Signal<SinglePreviewData | null>;
  onSetZoom: (nextZoom: number) => void;
  zoomStep: number;
}

export function PreviewWorkspace({
  mode,
  zoom,
  cards,
  singlePreview,
  onSetZoom,
  zoomStep,
}: PreviewWorkspaceProps) {
  const currentMode = mode.value;
  const currentSingle = singlePreview.value;
  const currentZoom = zoom.value;
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const fitToScreen = useCallback(() => {
    if (currentMode !== 'single' || !currentSingle || !wrapperRef.current) return;
    const wrapperWidth = wrapperRef.current.clientWidth - 64;
    const wrapperHeight = wrapperRef.current.clientHeight - 64;

    const scaleX = wrapperWidth / currentSingle.width;
    const scaleY = wrapperHeight / currentSingle.height;
    const optimalZoom = Math.min(scaleX, scaleY, 1);
    onSetZoom(optimalZoom);
  }, [currentMode, currentSingle, onSetZoom]);

  useEffect(() => {
    if (currentMode !== 'single') return;
    const onResize = () => fitToScreen();
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
    };
  }, [currentMode, fitToScreen]);

  return (
    <>
      <div
        id="zoom-controls"
        className="zoom-controls"
        style={{ display: currentMode === 'single' ? 'flex' : 'none' }}
      >
        <button id="zoom-out" onClick={() => onSetZoom(currentZoom - zoomStep)}>
          −
        </button>
        <span className="zoom-label" id="zoom-level">
          {Math.round(currentZoom * 100)}%
        </span>
        <button id="zoom-in" onClick={() => onSetZoom(currentZoom + zoomStep)}>
          +
        </button>
        <button id="zoom-fit" className="secondary" onClick={fitToScreen}>
          Fit
        </button>
      </div>

      <div
        id="preview-wrapper"
        className="preview-wrapper"
        ref={wrapperRef}
        style={{ display: currentMode === 'single' ? 'flex' : 'none' }}
      >
        <div
          id="iframe-scaler"
          style={{
            width: `${(currentSingle?.width || 0) * currentZoom}px`,
            height: `${(currentSingle?.height || 0) * currentZoom}px`,
          }}
        >
          <iframe
            id="preview-frame"
            src={currentSingle?.url || ''}
            onLoad={() => {
              setTimeout(fitToScreen, 100);
            }}
            style={{
              width: `${currentSingle?.width || 0}px`,
              height: `${currentSingle?.height || 0}px`,
              transform: `scale(${currentZoom})`,
              transformOrigin: 'top left',
            }}
          />
        </div>
      </div>

      <div
        id="preview-grid"
        className="preview-grid"
        style={{ display: currentMode === 'all' ? 'grid' : 'none' }}
      >
        <PreviewGrid cards={cards} />
      </div>

      <div id="empty-state" className="empty-state" style={{ display: currentMode === 'empty' ? 'block' : 'none' }}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>Select options above and click "Preview" to see your screenshot template</p>
      </div>
    </>
  );
}
