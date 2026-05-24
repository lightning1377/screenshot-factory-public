import {
  AppConfig,
  AppsResponse,
  ConfigResponse,
  TemplateResponse,
  TemplatesResponse,
  CaptureJob,
  CaptureStartResponse,
  DevicesResponse,
} from '../types';

export interface CaptureOptions {
  configPath: string;
  deviceType?: string;
  serial?: string;
}

export interface RenderOptions {
  configPath: string;
  deviceType?: string;
}

export interface UpdateAppPayload {
  sceneConfigs?: any[];
  name?: string;
  scenes?: string[];
}

export interface CreateTemplatePayload {
  name: string;
  content: string;
}

export class ScreenshotFactorySDK {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = new Error(`Request failed: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    return response.json();
  }

  // Apps API
  async getApps(): Promise<AppsResponse> {
    return this.request<AppsResponse>('/api/apps');
  }

  async getApp(appId: string): Promise<AppConfig> {
    return this.request<AppConfig>(`/api/apps/${appId}`);
  }

  async updateApp(appId: string, payload: UpdateAppPayload): Promise<AppConfig> {
    return this.request<AppConfig>(`/api/apps/${appId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Config API
  async readConfig(path: string): Promise<ConfigResponse> {
    return this.request<ConfigResponse>('/api/config/read', {
      method: 'POST',
      body: JSON.stringify({ path }),
    });
  }

  async saveConfig(path: string, config: AppConfig): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/config/save', {
      method: 'POST',
      body: JSON.stringify({ path, config }),
    });
  }

  // Templates API
  async getTemplates(): Promise<TemplatesResponse> {
    return this.request<TemplatesResponse>('/api/templates');
  }

  async getTemplate(name: string): Promise<TemplateResponse> {
    return this.request<TemplateResponse>(`/api/templates/${name}`);
  }

  async updateTemplate(name: string, content: string): Promise<{ success: boolean; name: string }> {
    return this.request<{ success: boolean; name: string }>(`/api/templates/${name}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async createTemplate(
    payload: CreateTemplatePayload,
  ): Promise<{ success: boolean; name: string }> {
    return this.request<{ success: boolean; name: string }>('/api/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createConfig(payload: { name: string; appId: string }): Promise<ConfigResponse> {
    return this.request<ConfigResponse>('/api/config/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Capture API
  async startCapture(options: CaptureOptions): Promise<CaptureStartResponse> {
    return this.request<CaptureStartResponse>('/api/capture/run', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getCaptureRun(id: string, from = 0): Promise<CaptureJob> {
    return this.request<CaptureJob>(`/api/capture/runs/${id}?from=${from}`);
  }

  async stopCapture(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/capture/runs/${id}`, {
      method: 'DELETE',
    });
  }

  // Render API
  async startRender(options: RenderOptions): Promise<CaptureStartResponse> {
    return this.request<CaptureStartResponse>('/api/render/run', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getRenderRun(id: string, from = 0): Promise<CaptureJob> {
    return this.request<CaptureJob>(`/api/render/runs/${id}?from=${from}`);
  }

  async stopRender(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/render/runs/${id}`, {
      method: 'DELETE',
    });
  }

  // Devices API
  async getDevices(): Promise<DevicesResponse> {
    return this.request<DevicesResponse>('/api/devices');
  }

  // Emulators API
  async listEmulators(): Promise<any[]> {
    return this.request<any[]>('/api/capture/emulators');
  }

  async bootEmulator(id: string, type: 'android' | 'ios'): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/api/capture/emulators/boot', {
      method: 'POST',
      body: JSON.stringify({ id, type }),
    });
  }

  async discoverScreenshots(options: { configPath: string }): Promise<{ screenshots: any[] }> {
    return this.request<{ screenshots: any[] }>('/api/upload/discover', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async prepareUpload(options: {
    configPath: string;
    uploadOrder?: string[];
  }): Promise<{ id: string }> {
    return this.request<{ id: string }>('/api/upload/prepare', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async startUpload(options: {
    configPath: string;
    dryRun?: boolean;
    uploadOrder?: string[];
  }): Promise<{ id: string }> {
    return this.request<{ id: string }>('/api/upload/run', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getUploadRun(id: string, from = 0): Promise<any> {
    return this.request<any>(`/api/upload/runs/${id}?from=${from}`);
  }
}

// Create singleton instance
export const screenshotFactorySDK = new ScreenshotFactorySDK();
