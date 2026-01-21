'use client';

import { CheckCircle, Microphone, Tag } from '@phosphor-icons/react/dist/ssr';
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  TIER_COLORS,
  TIER_LABELS,
  type ToolCategory,
  type ToolIndexEntry,
} from '@/types/tools';

interface ToolCardProps {
  tool: ToolIndexEntry;
  isInstalled?: boolean;
  onInstall: (tool: ToolIndexEntry) => void;
  onClick: (tool: ToolIndexEntry) => void;
}

export function ToolCard({ tool, isInstalled, onInstall, onClick }: ToolCardProps) {
  const categoryColor =
    CATEGORY_COLORS[tool.category as ToolCategory] || 'bg-gray-500/20 text-gray-400';
  const tierColor = TIER_COLORS[tool.tier] || 'bg-gray-500/20 text-gray-400';
  const categoryLabel = CATEGORY_LABELS[tool.category as ToolCategory] || tool.category;
  const tierLabel = TIER_LABELS[tool.tier] || tool.tier;

  return (
    <div
      onClick={() => onClick(tool)}
      className="bg-muted/30 hover:border-primary flex cursor-pointer flex-col rounded-xl border p-4 transition-colors"
    >
      {/* Header badges */}
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
          {categoryLabel}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tierColor}`}>
          {tierLabel}
        </span>
      </div>

      {/* Title and description */}
      <h3 className="mb-1 font-semibold">{tool.name.replace(/-/g, ' ')}</h3>
      <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{tool.description}</p>

      {/* Voice triggers */}
      {tool.voice_triggers.length > 0 && (
        <div className="mb-3">
          <div className="text-muted-foreground mb-1 flex items-center gap-1 text-xs">
            <Microphone className="h-3 w-3" />
            <span>Voice triggers</span>
          </div>
          <p className="text-xs text-blue-400 italic">
            &ldquo;{tool.voice_triggers[0]}&rdquo;
            {tool.voice_triggers.length > 1 && (
              <span className="text-muted-foreground"> +{tool.voice_triggers.length - 1} more</span>
            )}
          </p>
        </div>
      )}

      {/* Tags */}
      {tool.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1">
          {tool.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs"
            >
              <Tag className="h-2.5 w-2.5" />
              {tag}
            </span>
          ))}
          {tool.tags.length > 4 && (
            <span className="text-muted-foreground text-xs">+{tool.tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Install button */}
      {isInstalled ? (
        <div className="mt-auto flex items-center justify-center gap-2 rounded-lg bg-green-500/10 px-4 py-2 text-sm font-medium text-green-400">
          <CheckCircle className="h-4 w-4" weight="fill" />
          Installed
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInstall(tool);
          }}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-auto rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Install
        </button>
      )}
    </div>
  );
}
