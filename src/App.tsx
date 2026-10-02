import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTopBar } from './components/layout/MobileTopBar';
import { IngestPage } from './pages/IngestPage';
import { VictimQueryPage } from './pages/VictimQueryPage';
import { AccountExplorerPage } from './pages/AccountExplorerPage';
import { MuleDetectionPage } from './pages/MuleDetectionPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { CaseOfficerPage } from './pages/CaseOfficerPage';
import { SettingsPage } from './pages/SettingsPage';
import { DevGeneratorPage } from './pages/DevGeneratorPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

import { forensicEngine } from './engine/engine';
import { IngestionMetrics, TraceResult } from './types/dataset';
import { HeuristicThresholds, MuleDetectionResult, defaultHeuristicThresholds } from './types/heuristics';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => window.location.hash || '#/ingest');
  const [metrics, setMetrics] = useState<IngestionMetrics | null>(() => forensicEngine.getMetrics());
  const [last5Traces, setLast5Traces] = useState<TraceResult[]>([]);
  const [activeTrace, setActiveTrace] = useState<TraceResult | null>(null);
  const [selectedExplorerAccount, setSelectedExplorerAccount] = useState<string>('');
  const [detectionResults, setDetectionResults] = useState<MuleDetectionResult[]>([]);

  // Responsive sidebar collapse state:
  // >= 1024px: expanded (isCollapsed: false)
  // 768px to 1023px: collapsed (isCollapsed: true)
  // Persisted in localStorage inside try/catch
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('abhedya_sidebar_collapsed');
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 768 && window.innerWidth < 1024) {
        return true;
      }
    }
    return false;
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Dark Mode state persisted in localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('abhedya_dark_mode');
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('abhedya_dark_mode', JSON.stringify(isDarkMode));
    } catch {
      // Ignore
    }
  }, [isDarkMode]);

  // Load heuristic thresholds from localStorage or use defaults
  const [thresholds, setThresholds] = useState<HeuristicThresholds>(() => {
    try {
      const stored = localStorage.getItem('abhedya_heuristic_thresholds');
      if (stored) {
        return { ...defaultHeuristicThresholds, ...JSON.parse(stored) };
      }
    } catch {
      // Ignore
    }
    return defaultHeuristicThresholds;
  });

  const [localLlmEndpoint, setLocalLlmEndpoint] = useState<string>(() => {
    try {
      return localStorage.getItem('abhedya_llm_endpoint') || '';
    } catch {
      return '';
    }
  });

  // Listen to hash changes for routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/ingest';
      setCurrentRoute(hash);
      window.scrollTo(0, 0);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: string) => {
    window.location.hash = route;
    setCurrentRoute(route);
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('abhedya_sidebar_collapsed', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleIngestSuccess = (newMetrics: IngestionMetrics) => {
    setMetrics(newMetrics);
    setLast5Traces([]);
    setActiveTrace(null);
    setDetectionResults([]);
  };

  const handleTraceCompleted = (trace: TraceResult) => {
    setActiveTrace(trace);
    setLast5Traces((prev) => {
      const filtered = prev.filter((t) => t.victimAccount !== trace.victimAccount);
      return [trace, ...filtered].slice(0, 5);
    });
  };

  const handleSaveThresholds = (newThresholds: HeuristicThresholds) => {
    setThresholds(newThresholds);
    try {
      localStorage.setItem('abhedya_heuristic_thresholds', JSON.stringify(newThresholds));
    } catch {
      // Ignore
    }
  };

  const handleSaveLlmEndpoint = (endpoint: string) => {
    setLocalLlmEndpoint(endpoint);
    try {
      localStorage.setItem('abhedya_llm_endpoint', endpoint);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#fbfbfa] text-[#18181b] antialiased dark:bg-[#121214] dark:text-[#f4f4f5]">
      {/* Skip to Main Content Link (First focusable element) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-[#18181b] focus:px-3 focus:py-2 focus:text-xs focus:font-semibold focus:text-white focus:outline-none focus:ring-2 focus:ring-[#d97706] dark:focus:bg-[#f4f4f5] dark:focus:text-[#18181b]"
      >
        Skip to main content
      </a>

      {/* Persistent Left Sidebar */}
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={navigateTo}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileDrawerOpen}
        onCloseMobile={() => setIsMobileDrawerOpen(false)}
        metrics={metrics}
        flaggedMuleCount={detectionResults.length}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area - fills remaining width and scrolls on its own */}
      <div
        className={`flex flex-1 flex-col h-[100dvh] overflow-y-auto transition-all duration-200 ${
          isCollapsed ? 'md:ml-[64px]' : 'md:ml-[248px]'
        }`}
      >
        {/* Slim 48px top bar on screens under 768px */}
        <MobileTopBar onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />

        {/* Scrollable Page Content Container */}
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none pb-12">
          {(!currentRoute || currentRoute === '#/' || currentRoute === '#/ingest') && (
            <IngestPage
              engine={forensicEngine}
              onIngestSuccess={handleIngestSuccess}
              onNavigate={navigateTo}
            />
          )}

          {currentRoute === '#/victim-query' && (
            <VictimQueryPage
              engine={forensicEngine}
              last5Traces={last5Traces}
              activeTrace={activeTrace}
              onTraceCompleted={handleTraceCompleted}
              onSelectTraceTab={(t) => {
                setActiveTrace(t);
              }}
              onSelectAccount={(acc) => {
                setSelectedExplorerAccount(acc);
              }}
              onNavigate={navigateTo}
            />
          )}

          {currentRoute === '#/explorer' && (
            <AccountExplorerPage
              engine={forensicEngine}
              initialAccount={selectedExplorerAccount}
              onNavigateTrace={(acc) => {
                navigateTo('#/victim-query');
                setTimeout(() => {
                  forensicEngine.traceVictim(acc, 4).then((trace) => {
                    handleTraceCompleted(trace);
                  });
                }, 50);
              }}
            />
          )}

          {currentRoute === '#/detection' && (
            <MuleDetectionPage
              engine={forensicEngine}
              thresholds={thresholds}
              onTraceAccount={(acc) => {
                navigateTo('#/victim-query');
                setTimeout(() => {
                  forensicEngine.traceVictim(acc, 4).then((trace) => {
                    handleTraceCompleted(trace);
                  });
                }, 50);
              }}
              onSelectAccount={(acc) => {
                setSelectedExplorerAccount(acc);
                navigateTo('#/explorer');
              }}
              onOpenSettings={() => navigateTo('#/settings')}
              onDetectionRun={(res) => {
                setDetectionResults(res);
              }}
            />
          )}

          {currentRoute === '#/evaluation' && (
            <EvaluationPage
              engine={forensicEngine}
              detectionResults={detectionResults}
              onRunScanFirst={() => navigateTo('#/detection')}
            />
          )}

          {currentRoute === '#/case-officer' && (
            <CaseOfficerPage
              engine={forensicEngine}
              activeTrace={activeTrace}
              onNavigateTrace={() => navigateTo('#/victim-query')}
              localLlmEndpoint={localLlmEndpoint}
            />
          )}

          {currentRoute === '#/settings' && (
            <SettingsPage
              thresholds={thresholds}
              onSaveThresholds={handleSaveThresholds}
              localLlmEndpoint={localLlmEndpoint}
              onSaveLocalLlmEndpoint={handleSaveLlmEndpoint}
            />
          )}

          {currentRoute === '#/dev/generator' && (
            <DevGeneratorPage
              engine={forensicEngine}
              onDatasetLoaded={(m) => {
                handleIngestSuccess(m);
                navigateTo('#/victim-query');
              }}
              onNavigateTrace={(victim) => {
                navigateTo('#/victim-query');
                setTimeout(() => {
                  forensicEngine.traceVictim(victim, 4).then((trace) => {
                    handleTraceCompleted(trace);
                  });
                }, 50);
              }}
            />
          )}

          {currentRoute === '#/privacy' && <PrivacyPage />}

          {currentRoute === '#/terms' && <TermsPage />}
        </main>
      </div>
    </div>
  );
}
