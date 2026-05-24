// MainShell component

interface MainShellProps {
  currentPage: string;
  isExpanded: boolean;
  onPageChange: (page: string) => void;
  onToggleExpanded: (expanded: boolean) => void;
  children: any;
}

export function MainShell({
  currentPage,
  isExpanded,
  onPageChange,
  onToggleExpanded,
  children,
}: MainShellProps) {
  const navItems = [
    { id: 'landing', label: 'Home' },
    { id: 'configs', label: 'App Config' },
    { id: 'capture', label: 'Capture' },
    { id: 'preview', label: 'Preview' },
    { id: 'templates', label: 'Templates' },
    { id: 'upload', label: 'Upload' },
  ];

  return (
    <div class={`layout ${isExpanded ? 'is-expanded' : ''}`}>
      <aside class="sidebar">
        <div class="brand">
          <div class="brand-title">Screenshot Factory</div>
          <div class="brand-subtitle">Production Grade</div>
        </div>
        <nav class="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              class={currentPage === item.id ? 'active' : ''}
              onClick={() => onPageChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main class="content">
        <button
          id="zen-mode-toggle"
          class="zen-toggle"
          title="Toggle Zen Mode"
          onClick={() => onToggleExpanded(!isExpanded)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
        <div id="page-root">{children}</div>
      </main>
    </div>
  );
}
