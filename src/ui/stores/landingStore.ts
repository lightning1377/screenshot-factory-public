import { signal } from '@preact/signals';
import { screenshotFactorySDK } from '../sdk/ScreenshotFactorySDK';

export function createLandingStore() {
  const isModalOpen = signal(false);
  const newAppName = signal('');
  const newAppId = signal('');
  const isSubmitting = signal(false);

  const openModal = () => {
    isModalOpen.value = true;
    newAppName.value = '';
    newAppId.value = '';
  };

  const closeModal = () => {
    isModalOpen.value = false;
  };

  const createApp = async (onSuccess: (configPath: string) => void) => {
    const name = newAppName.value.trim();
    const appId = newAppId.value.trim();

    if (!name || !appId) return;

    isSubmitting.value = true;
    try {
      const result = await screenshotFactorySDK.createConfig({ name, appId });
      closeModal();
      onSuccess(result.configPath);
    } catch (err) {
      console.error('Failed to create app:', err);
      alert('Failed to create app: ' + (err as Error).message);
    } finally {
      isSubmitting.value = false;
    }
  };

  return {
    signals: {
      isModalOpen,
      newAppName,
      newAppId,
      isSubmitting,
    },
    actions: {
      openModal,
      closeModal,
      createApp,
    },
  };
}
