import React, { useState } from 'react';
import { Plus, X, Globe } from 'lucide-react';
import { useWidgetStore, QuickLink } from '../store/useWidgetStore';

export const QuickLinks: React.FC = () => {
  const showQuickLinks = useWidgetStore((s) => s.showQuickLinks);
  const quickLinks = useWidgetStore((s) => s.quickLinks);
  const addQuickLink = useWidgetStore((s) => s.addQuickLink);
  const removeQuickLink = useWidgetStore((s) => s.removeQuickLink);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  if (!showQuickLinks) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    addQuickLink(newTitle, newUrl);
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap max-w-xl mx-auto">
      {quickLinks.map((link) => {
        const domain = getDomain(link.url);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        return (
          <div key={link.id} className="relative group">
            <a
              href={link.url}
              title={link.title}
              className="flex flex-col items-center gap-1.5 w-18 p-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 transition-all duration-150 hover:scale-105 active:scale-95 text-white"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden">
                <img
                  src={faviconUrl}
                  alt={link.title}
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-[11px] font-medium truncate max-w-full text-white/90 drop-shadow-sm">
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
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-neutral-900/80 hover:bg-neutral-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}

      {/* Add new link button */}
      <button
        onClick={() => setIsAdding(true)}
        title="Add Shortcut"
        className="flex flex-col items-center justify-center w-18 h-[76px] p-2 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 text-white/80 hover:text-white transition-all duration-150 hover:scale-105 active:scale-95"
      >
        <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
          <Plus className="w-5 h-5" />
        </div>
        <span className="text-[11px] font-medium text-white/80 mt-1">Add</span>
      </button>

      {/* Add Shortcut Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl border border-neutral-200">
            <h3 className="text-sm font-semibold text-neutral-800 mb-3">Add Shortcut</h3>
            <form onSubmit={handleAdd} className="flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. GitHub"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider block mb-1">
                  URL
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. github.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium shadow-sm active:scale-95"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
