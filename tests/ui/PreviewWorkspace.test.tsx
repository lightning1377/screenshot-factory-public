import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@preact/signals';
import { PreviewWorkspace } from '../../src/ui/views/PreviewWorkspace';
import { findNode } from './vnode';

let wrapperSize = { clientWidth: 1160, clientHeight: 1960 };

vi.mock('preact/hooks', () => ({
  useCallback: <T extends (...args: never[]) => unknown>(fn: T) => fn,
  useEffect: () => undefined,
  useRef: () => ({ current: wrapperSize }),
}));

describe('PreviewWorkspace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('invokes zoom handlers with expected values in single mode', () => {
    const onSetZoom = vi.fn();
    const tree = PreviewWorkspace({
      mode: signal('single'),
      zoom: signal(1),
      cards: signal([]),
      singlePreview: signal({ url: '/templates/phone.html', width: 1080, height: 1920 }),
      onSetZoom,
      zoomStep: 0.1,
    });

    findNode(tree, (node) => node.props.id === 'zoom-in')?.props.onClick();
    findNode(tree, (node) => node.props.id === 'zoom-out')?.props.onClick();
    findNode(tree, (node) => node.props.id === 'zoom-fit')?.props.onClick();

    expect(onSetZoom).toHaveBeenCalledWith(1.1);
    expect(onSetZoom).toHaveBeenCalledWith(0.9);
    expect(onSetZoom).toHaveBeenCalledWith(0.9875); // min((1160-64)/1080, (1960-64)/1920, 1)
  });

  it('fits on iframe load and toggles mode display styles', () => {
    const onSetZoom = vi.fn();
    const tree = PreviewWorkspace({
      mode: signal('single'),
      zoom: signal(1),
      cards: signal([]),
      singlePreview: signal({ url: '/templates/phone.html', width: 1080, height: 1920 }),
      onSetZoom,
      zoomStep: 0.1,
    });

    const frame = findNode(tree, (node) => node.props.id === 'preview-frame');
    expect(frame).toBeTruthy();
    frame?.props.onLoad();
    vi.runAllTimers();

    expect(onSetZoom).toHaveBeenCalledWith(0.9875);

    const wrapper = findNode(tree, (node) => node.props.id === 'preview-wrapper');
    const grid = findNode(tree, (node) => node.props.id === 'preview-grid');
    const empty = findNode(tree, (node) => node.props.id === 'empty-state');

    expect(wrapper?.props.style.display).toBe('flex');
    expect(grid?.props.style.display).toBe('none');
    expect(empty?.props.style.display).toBe('none');
  });
});
