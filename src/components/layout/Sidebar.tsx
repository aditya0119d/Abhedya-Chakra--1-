import React, { useEffect, useRef } from 'react';
import {
  Database,
  Search,
  UserSearch,
  Network,
  BarChart3,
  FileText,
  Settings,
  FlaskConical,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  X,
} from 'lucide-react';
import { siteConfig } from '../../config/site';
import { IngestionMetrics } from '../../types/dataset';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  metrics: IngestionMetrics | null;
  flaggedMuleCount?: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRoute,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  metrics,
  flaggedMuleCount,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const sidebarRef = useRef<HTMLElement>(null);

  // Keyboard navigation: Escape key closes mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onCloseMobile]);

  // Focus trap for mobile drawer when open
  useEffect(() => {
    if (isMobileOpen && sidebarRef.current) {
      const focusable = sidebarRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])'
      );
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  }, [isMobileOpen]);

  const showDevGenerator = import.meta.env.VITE_DEV_TOOLS === 'true';

  const navItems = [
    { id: '#/ingest', label: 'Ingest', icon: Database },
    { id: '#/victim-query', label: 'Blind Victim Query', icon: Search },
    { id: '#/explorer', label: 'Account Explorer', icon: UserSearch },
    {
      id: '#/detection',
      label: 'Mule Detection',
      icon: Network,
      badge: flaggedMuleCount && flaggedMuleCount > 0 ? flaggedMuleCount.toLocaleString() : null,
    },
    { id: '#/evaluation', label: 'Evaluation', icon: BarChart3 },
    { id: '#/case-officer', label: 'Case Officer', icon: FileText },
    { id: '#/settings', label: 'Settings', icon: Settings },
    ...(showDevGenerator
      ? [{ id: '#/dev/generator', label: 'Synthetic Generator', icon: FlaskConical }]
      : []),
  ];

  const handleLinkClick = (e: React.MouseEvent, route: string) => {
    e.preventDefault();
    onNavigate(route);
    if (isMobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Persistent / Off-canvas Sidebar Element */}
      <aside
        ref={sidebarRef}
        aria-label="Primary Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 flex h-[100dvh] flex-col border-r border-[#e4e4e0] bg-[#fbfbfa] text-[#18181b] transition-all duration-200 dark:border-[#27272a] dark:bg-[#121214] dark:text-[#f4f4f5] ${
          isCollapsed ? 'w-[64px]' : 'w-[248px]'
        } ${
          isMobileOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#e4e4e0] px-3.5 dark:border-[#27272a]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {/* Inline SVG Favicon Mark */}
            <svg
              className="h-6 w-6 shrink-0"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              width="24"
              height="24"
              aria-hidden="true"
            >
              <rect width="64" height="64" rx="8" fill="#18181b" />
              <circle
                cx="32"
                cy="32"
                r="22"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeDasharray="4 2"
              />
              <circle
                cx="32"
                cy="32"
                r="14"
                fill="none"
                stroke="#0d9488"
                strokeWidth="2"
              />
              <circle cx="32" cy="32" r="5" fill="#f4f4f5" />
              <line x1="32" y1="10" x2="32" y2="54" stroke="#71717a" strokeWidth="1.5" />
              <line x1="10" y1="32" x2="54" y2="32" stroke="#71717a" strokeWidth="1.5" />
              <circle cx="32" cy="10" r="3" fill="#d97706" />
              <circle cx="54" cy="32" r="3" fill="#0d9488" />
              <circle cx="32" cy="54" r="3" fill="#d97706" />
              <circle cx="10" cy="32" r="3" fill="#0d9488" />
            </svg>

            {!isCollapsed && (
              <span className="truncate font-mono text-sm font-bold tracking-tight text-[#18181b] dark:text-[#f4f4f5]">
                {siteConfig.shortName}
              </span>
            )}
          </div>

          {/* Close button inside mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="flex h-8 w-8 items-center justify-center rounded text-[#71717a] hover:bg-[#f4f4f2] md:hidden dark:hover:bg-[#1e1e22]"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Primary Navigation List (scrolls only if window is too short) */}
        <nav aria-label="Primary" className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentRoute === item.id ||
                (item.id === '#/ingest' && (currentRoute === '#/' || currentRoute === ''));

              return (
                <li key={item.id} className="relative group">
                  <a
                    href={item.id}
                    onClick={(e) => handleLinkClick(e, item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex h-10 w-full items-center rounded-lg text-xs font-medium transition-colors ${
                      isCollapsed ? 'justify-center px-0' : 'px-3'
                    } ${
                      isActive
                        ? 'bg-[#f4f4f2] font-semibold text-[#18181b] dark:bg-[#1e1e22] dark:text-[#f4f4f5]'
                        : 'text-[#52525b] hover:bg-[#f4f4f2] hover:text-[#18181b] dark:text-[#a1a1aa] dark:hover:bg-[#1e1e22] dark:hover:text-[#f4f4f5]'
                    }`}
                  >
                    {/* Active item 3px left indicator bar in amber */}
                    {isActive && (
                      <span
                        className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-[#d97706]"
                        aria-hidden="true"
                      />
                    )}

                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />

                    {!isCollapsed && (
                      <span className="ml-3 truncate">{item.label}</span>
                    )}

                    {/* Measured value badge only */}
                    {!isCollapsed && item.badge && (
                      <span className="ml-auto rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </a>

                  {/* Accessible tooltip for collapsed mode */}
                  {isCollapsed && (
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute left-full top-1/2 ml-2 z-50 -translate-y-1/2 rounded border border-[#e4e4e0] bg-[#18181b] px-2 py-1 text-[11px] font-medium text-white shadow-xs opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-[#3f3f46] dark:bg-[#27272a] whitespace-nowrap"
                    >
                      {item.label}
                      {item.badge && ` (${item.badge})`}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse toggle button at bottom of nav list (hidden on mobile) */}
        <div className="hidden border-t border-[#e4e4e0] px-2 py-2 md:block dark:border-[#27272a]">
          <button
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-9 w-full items-center justify-center rounded-lg text-xs font-medium text-[#71717a] hover:bg-[#f4f4f2] hover:text-[#18181b] dark:text-[#a1a1aa] dark:hover:bg-[#1e1e22] dark:hover:text-[#f4f4f5] cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <div className="flex w-full items-center justify-between px-2">
                <span className="text-[11px]">Collapse sidebar</span>
                <ChevronLeft className="h-4 w-4" />
              </div>
            )}
          </button>
        </div>

        {/* Sidebar Footer: Data Status Block & Legal Links */}
        <div className="border-t border-[#e4e4e0] p-3 text-xs dark:border-[#27272a]">
          {/* Measured Data Status Block */}
          {!isCollapsed ? (
            <div className="rounded border border-[#e4e4e0] bg-[#f4f4f2] p-2.5 font-mono text-[11px] dark:border-[#27272a] dark:bg-[#18181b]">
              <div className="text-[10px] uppercase tracking-wider text-[#71717a] dark:text-[#a1a1aa]">
                Ledger Status
              </div>
              {metrics ? (
                <div className="mt-1 space-y-0.5 text-[#18181b] dark:text-[#f4f4f5]">
                  <div>
                    Rows: <strong>{metrics.rowCount.toLocaleString()}</strong>
                  </div>
                  <div>
                    Accounts: <strong>{metrics.distinctAccounts.toLocaleString()}</strong>
                  </div>
                  <div className="text-[10px] text-[#71717a] dark:text-[#a1a1aa]">
                    Load: {(metrics.elapsedMs / 1000).toFixed(2)}s
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-[#71717a] dark:text-[#a1a1aa]">No data loaded</div>
              )}
            </div>
          ) : (
            <div
              title={
                metrics
                  ? `${metrics.rowCount.toLocaleString()} rows, ${metrics.distinctAccounts.toLocaleString()} accounts`
                  : 'No data loaded'
              }
              className="flex justify-center py-1"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  metrics ? 'bg-teal-600' : 'bg-amber-600'
                }`}
              />
            </div>
          )}

          {/* Links & Theme Toggle */}
          <div
            className={`mt-3 flex items-center justify-between pt-2 border-t border-[#e4e4e0] dark:border-[#27272a] ${
              isCollapsed ? 'flex-col gap-2' : ''
            }`}
          >
            {!isCollapsed && (
              <div className="flex gap-2.5 text-[11px] text-[#71717a] dark:text-[#a1a1aa]">
                <a
                  href="#/privacy"
                  onClick={(e) => handleLinkClick(e, '#/privacy')}
                  className="hover:text-[#18181b] hover:underline dark:hover:text-[#f4f4f5]"
                >
                  Privacy
                </a>
                <span>&middot;</span>
                <a
                  href="#/terms"
                  onClick={(e) => handleLinkClick(e, '#/terms')}
                  className="hover:text-[#18181b] hover:underline dark:hover:text-[#f4f4f5]"
                >
                  Terms
                </a>
              </div>
            )}

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-7 w-7 items-center justify-center rounded text-[#71717a] hover:bg-[#f4f4f2] hover:text-[#18181b] dark:text-[#a1a1aa] dark:hover:bg-[#1e1e22] dark:hover:text-[#f4f4f5] cursor-pointer"
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
