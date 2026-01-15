'use client';

import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowClockwise, MagnifyingGlass, Warning, X } from '@phosphor-icons/react/dist/ssr';
import { useToolRegistry } from '@/hooks/useToolRegistry';
import type { ToolIndexEntry } from '@/types/tools';
import { CategoryFilter } from './category-filter';
import { ToolCard } from './tool-card';
import { ToolDetailModal } from './tool-detail-modal';
import { ToolInstallModal } from './tool-install-modal';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ToolsPanel({ isOpen, onClose }: ToolsPanelProps) {
  const {
    filteredTools,
    loading,
    error,
    selectedCategory,
    searchQuery,
    setCategory,
    setSearch,
    refresh,
  } = useToolRegistry();

  const [installingTool, setInstallingTool] = useState<ToolIndexEntry | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolIndexEntry | null>(null);
  const [n8nEnabled, setN8nEnabled] = useState<boolean | null>(null);
  const [checkingN8n, setCheckingN8n] = useState(true);

  const checkN8nStatus = useCallback(async () => {
    setCheckingN8n(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setN8nEnabled(data.settings?.n8n_enabled ?? false);
      }
    } catch {
      setN8nEnabled(false);
    } finally {
      setCheckingN8n(false);
    }
  }, []);

  // Load registry and check n8n status when panel opens
  useEffect(() => {
    if (isOpen) {
      refresh();
      checkN8nStatus();
    }
  }, [isOpen, refresh, checkN8nStatus]);

  const handleInstall = useCallback((tool: ToolIndexEntry) => {
    setSelectedTool(null); // Close detail modal if open
    setInstallingTool(tool);
  }, []);

  const handleCardClick = useCallback((tool: ToolIndexEntry) => {
    setSelectedTool(tool);
  }, []);

  const handleInstallComplete = useCallback(() => {
    // Could refresh registry here if needed
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="bg-background absolute inset-y-0 right-0 flex w-full flex-col shadow-2xl sm:w-[80%] sm:max-w-4xl">
        {/* Header */}
        <header className="shrink-0 border-b">
          <div className="flex items-center justify-between px-6 py-5">
            <h1 className="text-2xl font-bold">Tools</h1>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full p-2 transition-colors"
            >
              <X className="h-6 w-6" weight="bold" />
            </button>
          </div>

          {/* Search and filter */}
          <div className="space-y-3 px-6 pb-4">
            {/* Search input */}
            <div className="relative">
              <MagnifyingGlass className="text-muted-foreground absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools..."
                className="border-input bg-muted/50 w-full rounded-lg border py-2.5 pr-4 pl-10 text-sm"
              />
            </div>

            {/* Category filter */}
            <CategoryFilter selected={selectedCategory} onSelect={setCategory} />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* n8n not enabled warning */}
          {!checkingN8n && n8nEnabled === false && (
            <div className="mb-6 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
              <div className="flex items-start gap-3">
                <Warning className="h-5 w-5 shrink-0 text-orange-400" weight="bold" />
                <div>
                  <p className="font-medium text-orange-200">n8n not configured</p>
                  <p className="text-sm text-orange-300/80">
                    Enable n8n in Settings → Integrations to install tools.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowClockwise className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-muted-foreground mt-4">Loading tools...</p>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Warning className="h-8 w-8 text-red-500" />
              <p className="text-muted-foreground mt-4">{error}</p>
              <button
                onClick={refresh}
                className="bg-muted hover:bg-muted/80 mt-4 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredTools.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground">No tools found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearch('')}
                  className="text-primary mt-2 text-sm hover:underline"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {/* Tool grid */}
          {!loading && !error && filteredTools.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTools.map((tool) => (
                <ToolCard
                  key={tool.path}
                  tool={tool}
                  onInstall={n8nEnabled ? handleInstall : () => {}}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Detail modal */}
      {selectedTool && (
        <ToolDetailModal
          tool={selectedTool}
          onClose={() => setSelectedTool(null)}
          onInstall={handleInstall}
          n8nEnabled={n8nEnabled ?? false}
        />
      )}

      {/* Install modal */}
      {installingTool && (
        <ToolInstallModal
          tool={installingTool}
          onClose={() => setInstallingTool(null)}
          onInstallComplete={handleInstallComplete}
        />
      )}
    </div>,
    document.body
  );
}
