import { getAllAssets, getAsset, saveAsset } from "../assets/db";

export const TAG_LABEL_COLORS = [
  "#46BAEB", // Brand Blue
  "#00BF63", // Brand Green
  "#F59E0B", // Amber
  "#E03131", // Coral / Red
  "#8B5CF6", // Purple
  "#64748B", // Slate / Gray
] as const;

export interface TagInfo {
  name: string;
  color: string;
}

const TAG_STORAGE_KEY = "papertab_tag_registry";

function loadStoredTags(): Record<string, string> {
  try {
    const raw = localStorage.getItem(TAG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredTags(tags: Record<string, string>): void {
  try {
    localStorage.setItem(TAG_STORAGE_KEY, JSON.stringify(tags));
  } catch {}
}

/**
 * Returns all registered tags and their label colors.
 */
export async function getAllTagInfos(): Promise<TagInfo[]> {
  const stored = loadStoredTags();
  let assets: any[] = [];
  try {
    assets = await getAllAssets();
  } catch {
    // Graceful fallback if indexedDB is unavailable (e.g. tests)
  }

  // Also collect tags present on assets even if not yet in registry
  const tagColors = { ...stored };
  let colorIdx = 0;

  for (const a of assets) {
    if (Array.isArray(a.tags)) {
      for (const t of a.tags) {
        const clean = t.trim().toLowerCase();
        if (clean && !tagColors[clean]) {
          tagColors[clean] = TAG_LABEL_COLORS[colorIdx % TAG_LABEL_COLORS.length];
          colorIdx++;
        }
      }
    }
  }

  return Object.entries(tagColors)
    .map(([name, color]) => ({
      name,
      color,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Create or update a tag's color.
 */
export async function createOrUpdateTag(name: string, color?: string): Promise<TagInfo> {
  const clean = name.trim().toLowerCase().replace(/^#/, "");
  if (!clean) throw new Error("Tag name cannot be empty");

  const stored = loadStoredTags();
  const assignedColor =
    color ||
    stored[clean] ||
    TAG_LABEL_COLORS[Object.keys(stored).length % TAG_LABEL_COLORS.length];

  stored[clean] = assignedColor;
  saveStoredTags(stored);

  return { name: clean, color: assignedColor };
}

/**
 * Rename a tag across the registry and all stored assets in IndexedDB.
 */
export async function renameTag(oldName: string, newName: string): Promise<void> {
  const cleanOld = oldName.trim().toLowerCase().replace(/^#/, "");
  const cleanNew = newName.trim().toLowerCase().replace(/^#/, "");
  if (!cleanOld || !cleanNew || cleanOld === cleanNew) return;

  const stored = loadStoredTags();
  const oldColor = stored[cleanOld] || TAG_LABEL_COLORS[0];
  delete stored[cleanOld];
  stored[cleanNew] = stored[cleanNew] || oldColor;
  saveStoredTags(stored);

  // Update all assets referencing cleanOld
  try {
    const assets = await getAllAssets();
    for (const asset of assets) {
      if (Array.isArray(asset.tags) && asset.tags.some((t: string) => t.toLowerCase() === cleanOld)) {
        const nextTags = asset.tags.map((t: string) =>
          t.toLowerCase() === cleanOld ? cleanNew : t,
        );
        // Deduplicate tags
        asset.tags = Array.from(new Set(nextTags));
        await saveAsset(asset);
      }
    }
  } catch {
    // If indexedDB is unavailable in test environment, registry update still completes
  }
}

/**
 * Delete a tag from registry and remove from all assets.
 */
export async function deleteTag(name: string): Promise<void> {
  const clean = name.trim().toLowerCase().replace(/^#/, "");
  if (!clean) return;

  const stored = loadStoredTags();
  delete stored[clean];
  saveStoredTags(stored);

  try {
    const assets = await getAllAssets();
    for (const asset of assets) {
      if (Array.isArray(asset.tags) && asset.tags.some((t: string) => t.toLowerCase() === clean)) {
        asset.tags = asset.tags.filter((t: string) => t.toLowerCase() !== clean);
        await saveAsset(asset);
      }
    }
  } catch {}
}

/**
 * Merge sourceTag into targetTag across all assets.
 */
export async function mergeTags(sourceTag: string, targetTag: string): Promise<void> {
  const cleanSource = sourceTag.trim().toLowerCase().replace(/^#/, "");
  const cleanTarget = targetTag.trim().toLowerCase().replace(/^#/, "");
  if (!cleanSource || !cleanTarget || cleanSource === cleanTarget) return;

  const stored = loadStoredTags();
  delete stored[cleanSource];
  saveStoredTags(stored);

  try {
    const assets = await getAllAssets();
    for (const asset of assets) {
      if (Array.isArray(asset.tags) && asset.tags.some((t: string) => t.toLowerCase() === cleanSource)) {
        const nextTags = asset.tags.map((t: string) =>
          t.toLowerCase() === cleanSource ? cleanTarget : t,
        );
        asset.tags = Array.from(new Set(nextTags));
        await saveAsset(asset);
      }
    }
  } catch {}
}

/**
 * Bulk apply a tag to multiple assets.
 */
export async function bulkApplyTag(assetIds: string[], tag: string): Promise<void> {
  const clean = tag.trim().toLowerCase().replace(/^#/, "");
  if (!clean) return;

  await createOrUpdateTag(clean);

  try {
    for (const id of assetIds) {
      const asset = await getAsset(id);
      if (asset) {
        const current = Array.isArray(asset.tags) ? asset.tags : [];
        if (!current.some((t: string) => t.toLowerCase() === clean)) {
          asset.tags = [...current, clean];
          await saveAsset(asset);
        }
      }
    }
  } catch {}
}

/**
 * Bulk remove a tag from multiple assets.
 */
export async function bulkRemoveTag(assetIds: string[], tag: string): Promise<void> {
  const clean = tag.trim().toLowerCase().replace(/^#/, "");
  if (!clean) return;

  try {
    for (const id of assetIds) {
      const asset = await getAsset(id);
      if (asset && Array.isArray(asset.tags)) {
        asset.tags = asset.tags.filter((t: string) => t.toLowerCase() !== clean);
        await saveAsset(asset);
      }
    }
  } catch {}
}
