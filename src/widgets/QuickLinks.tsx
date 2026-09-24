import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useWidgetStore, MAX_QUICK_LINKS } from '../store/useWidgetStore';
import { useAppStore } from '../store/useAppStore';
import { isColorLight, cn } from '../lib/utils';

interface QuickLinksProps {
  isLight?: boolean;
}

export const QuickLinks: React.FC<QuickLinksProps> = ({ isLight: propIsLight }) => {
  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);
  const quickLinks = useWidgetStore((s) => s.quickLinks);
  const addQuickLink = useWidgetStore((s) => s.addQuickLink);
  const removeQuickLink = useWidgetStore((s) => s.removeQuickLink);
  const background = useAppStore((s) => s.background);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const canAddMore = quickLinks.length < MAX_QUICK_LINKS;

  useEffect(() => {
    if (!isAdding) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsAdding(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdding]);

  const isLight =
    propIsLight !== undefined
      ? propIsLight
      : !(background?.type === 'image' && background?.imageUrl) &&
        isColorLight(background?.color || '#14141a');

  if (!showQuickLinks) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !canAddMore) return;
    addQuickLink(newTitle, newUrl);
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap max-w-xl mx-auto select-none">
      {quickLinks.map((link) => {
        const domain = getDomain(link.url);
        const faviconUrl = domain
          ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
          : '';

        return (
          <div key={link.id} className="relative group">
            <a
              href={link.url}
              title={link.title}
              className={cn(
                'flex flex-col items-center gap-1.5 w-18 p-2 rounded-2xl backdrop-blur-md transition-all duration-150 hover:scale-105 active:scale-95 shadow-md',
                isLight
                  ? 'bg-white/80 hover:bg-white/95 border border-neutral-200/90 text-neutral-900 shadow-sm hover:shadow-md'
                  : 'bg-white/10 hover:bg-white/20 border border-white/15 text-white'
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden',
                  isLight ? 'bg-neutral-100 border border-neutral-200/60' : 'bg-white/20'
                )}
              >
                <img
                  src={faviconUrl}
                  alt={link.title}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span
                className={cn(
                  'text-[11px] font-semibold truncate max-w-full drop-shadow-xs',
                  isLight ? 'text-neutral-800' : 'text-white/90'
                )}
              >
                {link.title}
              </span>
            </a>

            {/* Remove button on hover */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeQuickLink(link.id);
              }}
              title="Remove shortcut"
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neutral-900/90 hover:bg-neutral-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Add new link button (shown when below limit) */}
      {canAddMore && (
        <button
          onClick={() => setIsAdding(true)}
          title="Add Shortcut"
          className={cn(
            'flex flex-col items-center justify-center w-18 h-[76px] p-2 rounded-2xl backdrop-blur-md transition-all duration-150 hover:scale-105 active:scale-95 shadow-md cursor-pointer',
            isLight
              ? 'bg-white/80 hover:bg-white/95 border border-neutral-200/90 text-neutral-700 hover:text-neutral-900 shadow-sm hover:shadow-md'
              : 'bg-white/10 hover:bg-white/20 border border-white/15 text-white/80 hover:text-white'
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center',
              isLight ? 'bg-neutral-100 border border-neutral-200/60' : 'bg-white/15'
            )}
          >
            <Plus className="w-5 h-5" />
          </div>
          <span
            className={cn(
              'text-[11px] font-semibold mt-1',
              isLight ? 'text-neutral-700' : 'text-white/80'
            )}
          >
            Add
          </span>
        </button>
      )}

      {/* Add Shortcut Modal */}
      {isAdding && (
        <div
          onClick={() => setIsAdding(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">Add Shortcut</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. GitHub"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 shadow-sm"
                >
                  Add Shortcut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
