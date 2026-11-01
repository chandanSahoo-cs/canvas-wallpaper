import React, { useEffect, useState } from "react";
import {
  Check,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { getAssetThumbObjectUrl } from "../../lib/assets/urls";
import { InboxItem } from "../../lib/inbox/types";
import { cn } from "../../lib/utils";

interface InboxItemCardProps {
  item: InboxItem;
  onPlace: (item: InboxItem) => void;
  onDismiss: (id: string) => void;
  onRestore?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const InboxItemCard: React.FC<InboxItemCardProps> = ({
  item,
  onPlace,
  onDismiss,
  onRestore,
  onDelete,
}) => {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (item.kind === "image" && item.assetId) {
      getAssetThumbObjectUrl(item.assetId).then((url) => {
        if (active && url) {
          setThumbUrl(url);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [item.assetId, item.kind]);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData(
      "application/papertab-inbox-item",
      JSON.stringify(item),
    );
    e.dataTransfer.setData("text/plain", item.url || item.text || item.title || "");
  };

  const domain = item.url
    ? (() => {
        try {
          return new URL(item.url).hostname.replace(/^www\./, "");
        } catch {
          return item.url;
        }
      })()
    : undefined;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={cn(
        "group relative bg-paper border-2 border-line rounded-sk p-2.5 flex flex-col gap-2 transition-all select-none cursor-grab active:cursor-grabbing hover:shadow-hard-sm",
        item.state === "dismissed" && "opacity-60 bg-paper/60 border-line/40",
      )}
    >
      {/* Top row: badge & actions */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          {item.state === "new" && (
            <span className="px-1.5 py-0.2 rounded-sk-sm bg-brand-blue text-on-accent font-hand font-bold text-[10px] uppercase tracking-wider">
              New
            </span>
          )}
          {item.state === "placed" && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-sk-sm bg-brand-green/20 text-brand-green font-hand font-bold text-[10px]">
              <Check className="w-2.5 h-2.5" /> Placed
            </span>
          )}
          {item.state === "dismissed" && (
            <span className="px-1.5 py-0.2 rounded-sk-sm bg-line/10 text-muted font-hand font-bold text-[10px]">
              Dismissed
            </span>
          )}

          <span className="text-[10px] font-sans text-muted">
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {item.state !== "dismissed" ? (
            <>
              <button
                type="button"
                title="Add to current board"
                aria-label="Add to board"
                onClick={() => onPlace(item)}
                className="p-1 rounded-sk-sm bg-surface border border-line text-ink hover:bg-brand-blue hover:text-on-accent transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title="Dismiss from inbox"
                aria-label="Dismiss item"
                onClick={() => onDismiss(item.id)}
                className="p-1 rounded-sk-sm hover:bg-line/10 text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              {onRestore && (
                <button
                  type="button"
                  title="Restore to inbox"
                  aria-label="Restore item"
                  onClick={() => onRestore(item.id)}
                  className="p-1 rounded-sk-sm hover:bg-line/10 text-brand-blue transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  title="Permanently delete"
                  aria-label="Delete item"
                  onClick={() => onDelete(item.id)}
                  className="p-1 rounded-sk-sm hover:bg-danger/10 text-danger transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      {item.kind === "image" && (
        <div className="flex items-start gap-2.5">
          <div className="w-16 h-16 shrink-0 bg-surface rounded-sk border border-line/40 overflow-hidden flex items-center justify-center">
            {thumbUrl ? (
              <img
                src={thumbUrl}
                alt={item.title || "Image"}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted/60" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-hand font-bold text-xs text-ink truncate leading-snug">
              {item.title || "Web Image"}
            </h4>
            {item.source?.title && (
              <p className="font-sans text-[11px] text-muted truncate mt-0.5">
                From: {item.source.title}
              </p>
            )}
            {item.source?.url && (
              <a
                href={item.source.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 font-sans text-[10px] text-brand-blue hover:underline truncate max-w-full mt-1"
              >
                <span className="truncate">{item.source.url}</span>
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            )}
          </div>
        </div>
      )}

      {item.kind === "link" && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-sk-sm bg-brand-blue/15 text-blue-text flex items-center justify-center shrink-0">
              🔗
            </span>
            <h4 className="font-hand font-bold text-xs text-ink truncate flex-1">
              {item.title || item.url}
            </h4>
          </div>
          {domain && (
            <span className="font-sans text-[11px] text-muted truncate pl-5">
              {domain}
            </span>
          )}
          {item.fallbackReason === "cors_blocked" && (
            <span className="font-sans text-[10px] text-warning italic pl-5">
              Saved as link (CORS protected)
            </span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-sans text-[10px] text-brand-blue hover:underline truncate pl-5 mt-0.5"
            >
              <span className="truncate">{item.url}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </a>
          )}
        </div>
      )}

      {item.kind === "text" && (
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
            <blockquote className="font-sans text-xs text-ink line-clamp-3 italic border-l-2 border-brand-blue/40 pl-2">
              "{item.text}"
            </blockquote>
          </div>
          {item.source?.title && (
            <p className="font-sans text-[10px] text-muted truncate pl-5">
              — {item.source.title}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
