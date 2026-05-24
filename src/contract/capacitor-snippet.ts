import { App, URLOpenListenerEvent } from '@capacitor/app';

/**
 * Screenshot Contract Snippet
 * Add this to your App.tsx or main entry point
 *
 * @param router - The router instance (e.g., React Router's history or navigate)
 */
export function setupScreenshotContract(router: { push: (path: string) => void }) {
  App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const url = new URL(event.url);

    if (url.protocol !== 'myapp:') return;

    // Normalize path and split
    const segments = url.pathname.replace(/^\/+/, '').split('/');

    const feature = segments[0]; // "screenshot"
    const sceneKey = segments[1]; // rest of segments

    if (feature !== 'screenshot') return;

    // 1. Enable Marketing Mode (global flag)
    (window as any).MARKETING_MODE = true;

    // 2. Inject Fake Data
    (window as any).MOCK_DATA = true;

    // 3. Disable Animations
    document.body.classList.add('no-animations');
    const style = document.createElement('style');
    style.innerHTML = `
        * {
          transition: none !important;
          animation: none !important;
        }
      `;
    document.head.appendChild(style);

    // 4. Route to scene
    console.log(`[ScreenshotContract] Routing to scene: ${sceneKey}`);
    router.push(`/scenes/${sceneKey}`);
  });
}
