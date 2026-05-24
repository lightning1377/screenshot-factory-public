// Landing page
import type { AppSummary } from '../types';

interface LandingPageProps {
  apps: AppSummary[];
  onAppSelected: (path: string) => void;
  isModalOpen: boolean;
  newAppName: string;
  newAppId: string;
  isSubmitting: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onAppNameChange: (name: string) => void;
  onAppIdChange: (id: string) => void;
  onCreateApp: () => void;
}

export function LandingPage({
  apps,
  onAppSelected,
  isModalOpen,
  newAppName,
  newAppId,
  isSubmitting,
  onOpenModal,
  onCloseModal,
  onAppNameChange,
  onAppIdChange,
  onCreateApp,
}: LandingPageProps) {
  return (
    <div id="page-landing" class="page active">
      <header class="page-header">
        <div class="header-main">
          <h1>Select App Configuration</h1>
          <p>Choose an existing app or create a new one to start generating screenshots.</p>
        </div>
        <div class="header-actions">
          <button id="btn-new-app" class="btn btn-primary" onClick={onOpenModal}>
            <span class="icon">+</span>
            Create New App
          </button>
        </div>
      </header>

      <div class="landing-content">
        <div id="app-grid" class="app-grid">
          {apps.length === 0 ? (
            <div class="empty-state">No applications found. Create one to get started!</div>
          ) : (
            apps.map((app) => (
              <div
                key={app.configPath}
                class="app-card"
                onClick={() => onAppSelected(app.configPath)}
              >
                <div class="app-card-icon">{app.name.charAt(0).toUpperCase()}</div>
                <h3 class="app-card-title">{app.name}</h3>
                <div class="app-card-id">{app.packageName || 'No Package ID'}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div id="modal-new-app" class="modal active">
          <div class="modal-content">
            <header>
              <h2>Create New App Configuration</h2>
              <button class="btn-close" id="btn-close-new-app" onClick={onCloseModal}>
                &times;
              </button>
            </header>
            <form
              id="form-new-app"
              onSubmit={(e) => {
                e.preventDefault();
                onCreateApp();
              }}
            >
              <div class="form-group">
                <label for="new-app-name">App Name</label>
                <input
                  type="text"
                  id="new-app-name"
                  placeholder="e.g. My Awesome App"
                  required
                  value={newAppName}
                  onInput={(e) => onAppNameChange(e.currentTarget.value)}
                />
              </div>
              <div class="form-group">
                <label for="new-app-id">App Bundle ID / Package Name</label>
                <input
                  type="text"
                  id="new-app-id"
                  placeholder="e.g. com.example.app"
                  required
                  value={newAppId}
                  onInput={(e) => onAppIdChange(e.currentTarget.value)}
                />
              </div>
              <div class="form-actions">
                <button type="button" class="btn" id="btn-cancel-new-app" onClick={onCloseModal}>
                  Cancel
                </button>
                <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
