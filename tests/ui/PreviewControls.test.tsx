import { describe, it, expect, vi } from 'vitest';
import { signal } from '@preact/signals';
import { PreviewControls } from '../../src/ui/views/PreviewControls';
import { collectNodes, findNode } from './vnode';

vi.mock('preact/hooks', () => ({
  useEffect: () => undefined,
  useRef: () => ({ current: null }),
}));

describe('PreviewControls', () => {
  it('renders locale/template options and control states from signals', () => {
    const onLocaleChange = vi.fn();
    const tree = PreviewControls({
      locale: signal(''),
      scene: signal('home'),
      theme: signal('light'),
      deviceType: signal('phone'),
      template: signal('phone.html'),
      title: signal('Sample Title'),
      localeOptions: signal([
        { value: 'en', label: 'EN' },
        { value: 'fr', label: 'FR' },
      ]),
      sceneOptions: signal([{ value: 'home', label: 'Home' }]),
      themeOptions: signal([{ value: 'light', label: 'Light' }]),
      templateOptions: signal(['phone.html', 'tablet.html']),
      localeDisabled: signal(true),
      sceneDisabled: signal(false),
      themeDisabled: signal(false),
      templateDisabled: signal(false),
      previewDisabled: signal(true),
      previewAllDisabled: signal(false),
      renderDisabled: signal(false),
      stopRenderDisabled: signal(true),
      renderStatusMessage: signal('Rendering final outputs...'),
      renderStatusTone: signal('error'),
      renderLogs: signal('line 1\nline 2\n'),
      onLocaleChange,
      onDeviceChange: vi.fn(),
      onSceneChange: vi.fn(),
      onThemeChange: vi.fn(),
      onTemplateChange: vi.fn(),
      onTitleChange: vi.fn(),
      onPreview: vi.fn(),
      onPreviewAll: vi.fn(),
      onRender: vi.fn(),
      onStopRender: vi.fn(),
      onRefresh: vi.fn(),
      onSample: vi.fn(),
    });

    const localeSelect = findNode(tree, (node) => node.props.id === 'locale-select');
    expect(localeSelect).toBeTruthy();
    expect(localeSelect?.props.disabled).toBe(true);

    const localeOptions = collectNodes(localeSelect!, (node) => node.type === 'option');
    expect(localeOptions).toHaveLength(3); // placeholder + EN + FR

    const renderStatus = findNode(tree, (node) => node.props.id === 'render-final-status');
    expect(renderStatus?.props.style.color).toBe('var(--warning)');
    expect(renderStatus?.props.children).toBe('Rendering final outputs...');

    const logs = findNode(tree, (node) => node.props.id === 'render-final-logs');
    expect(logs?.props.children).toContain('line 2');
  });

  it('wires change/click handlers', async () => {
    const onLocaleChange = vi.fn();
    const onPreview = vi.fn();
    const onTemplateChange = vi.fn().mockResolvedValue(undefined);

    const tree = PreviewControls({
      locale: signal('en'),
      scene: signal('home'),
      theme: signal('light'),
      deviceType: signal('phone'),
      template: signal(''),
      title: signal(''),
      localeOptions: signal([{ value: 'en', label: 'EN' }]),
      sceneOptions: signal([{ value: 'home', label: 'Home' }]),
      themeOptions: signal([{ value: 'light', label: 'Light' }]),
      templateOptions: signal(['phone.html']),
      localeDisabled: signal(false),
      sceneDisabled: signal(false),
      themeDisabled: signal(false),
      templateDisabled: signal(false),
      previewDisabled: signal(false),
      previewAllDisabled: signal(false),
      renderDisabled: signal(false),
      stopRenderDisabled: signal(true),
      renderStatusMessage: signal('Ready'),
      renderStatusTone: signal('muted'),
      renderLogs: signal(''),
      onLocaleChange,
      onDeviceChange: vi.fn(),
      onSceneChange: vi.fn(),
      onThemeChange: vi.fn(),
      onTemplateChange,
      onTitleChange: vi.fn(),
      onPreview,
      onPreviewAll: vi.fn(),
      onRender: vi.fn(),
      onStopRender: vi.fn(),
      onRefresh: vi.fn(),
      onSample: vi.fn(),
    });

    const localeSelect = findNode(tree, (node) => node.props.id === 'locale-select');
    expect(localeSelect).toBeTruthy();
    localeSelect?.props.onChange({ currentTarget: { value: 'fr' } });
    expect(onLocaleChange).toHaveBeenCalledWith('fr');

    const templateSelect = findNode(tree, (node) => node.props.id === 'template-select-preview');
    expect(templateSelect).toBeTruthy();
    await templateSelect?.props.onChange({ currentTarget: { value: 'phone.html' } });
    expect(onTemplateChange).toHaveBeenCalledWith('phone.html');

    const previewButton = findNode(tree, (node) => node.props.id === 'preview-btn');
    expect(previewButton).toBeTruthy();
    previewButton?.props.onClick();
    expect(onPreview).toHaveBeenCalledTimes(1);
  });
});
