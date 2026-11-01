import React from "react";
import { ExternalLink, Tag } from "lucide-react";
import { ImageElement } from "../../elements/types";
import { useAppStore } from "../../store/useAppStore";
import { sanitizeWebUrl } from "../../lib/utils";

interface ImageDetailsSectionProps {
  imageElement: ImageElement;
}

export const ImageDetailsSection: React.FC<ImageDetailsSectionProps> = ({
  imageElement,
}) => {
  const updateSelectedElements = useAppStore((s) => s.updateSelectedElements);

  const caption = imageElement.caption || "";
  const showCaption = Boolean(imageElement.showCaption);
  const sourceUrl = imageElement.sourceUrl || "";
  const validatedUrl = sourceUrl ? sanitizeWebUrl(sourceUrl) : "";

  const handleCaptionChange = (val: string) => {
    updateSelectedElements({ caption: val });
  };

  const handleToggleShowCaption = () => {
    updateSelectedElements({ showCaption: !showCaption });
  };

  const handleSourceUrlChange = (val: string) => {
    updateSelectedElements({ sourceUrl: val });
  };

  return (
    <div className="pt-2.5 border-t border-line/20 flex flex-col gap-2.5">
      <div className="text-[10px] font-hand font-bold tracking-wider text-muted uppercase flex items-center gap-1">
        <Tag className="w-3 h-3 text-brand-blue" />
        <span>Image Details</span>
      </div>

      {/* Caption input + toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-hand font-bold text-ink">Caption</label>
        <input
          type="text"
          value={caption}
          placeholder="Add a caption..."
          onChange={(e) => handleCaptionChange(e.target.value)}
          className="w-full px-2 py-1 text-xs font-sans rounded-sk bg-paper text-ink border-2 border-line/30 focus:border-brand-blue focus:outline-none"
        />
        <label className="flex items-center gap-2 cursor-pointer pt-0.5 select-none">
          <input
            type="checkbox"
            checked={showCaption}
            onChange={handleToggleShowCaption}
            className="w-3.5 h-3.5 accent-brand-blue rounded-sk cursor-pointer"
          />
          <span className="text-[11px] font-hand text-ink">Show caption on canvas</span>
        </label>
      </div>

      {/* Source URL */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-hand font-bold text-ink">Source URL</label>
        <input
          type="url"
          value={sourceUrl}
          placeholder="https://example.com/..."
          onChange={(e) => handleSourceUrlChange(e.target.value)}
          className="w-full px-2 py-1 text-xs font-sans rounded-sk bg-paper text-ink border-2 border-line/30 focus:border-brand-blue focus:outline-none"
        />

        {validatedUrl && (
          <a
            href={validatedUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={validatedUrl}
            className="mt-1 px-2 py-1 rounded-sk bg-paper text-blue-text font-sans text-[11px] border border-line/20 flex items-center gap-1.5 hover:bg-surface hover:border-brand-blue transition-colors truncate"
          >
            <ExternalLink className="w-3 h-3 shrink-0" />
            <span className="truncate font-mono text-[10px]">{validatedUrl}</span>
          </a>
        )}
      </div>
    </div>
  );
};
