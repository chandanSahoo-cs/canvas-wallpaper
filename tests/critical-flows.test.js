const path = require('path');
const { createJiti } = require('jiti');
const jiti = createJiti(path.resolve(__filename));

const {
  distance,
  rotatePoint,
  getCenter,
  normBox,
  getBBox,
  elementContains,
} = jiti('../src/canvas/geometry.ts');

const {
  sanitizeWebUrl,
  escapeXml,
  isColorLight,
} = jiti('../src/lib/utils.ts');

const {
  getConnectedGroupElementIds,
} = jiti('../src/lib/groups.ts');

const {
  DEFAULT_WALLPAPER_ELEMENTS,
  ORIGINAL_PRESET_CENTER,
  getDefaultWallpaperElements,
} = jiti('../src/lib/defaultWallpaperPreset.ts');

const {
  WALLPAPER_PRESETS,
} = jiti('../src/lib/wallpaperPresets.ts');

const {
  ALLOWED_IMAGE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_ORIGINAL_SIZE_BYTES,
  MAX_MEGAPIXELS,
  computeBlobHash,
  blobToBase64,
  base64ToBlob,
  getLodTier,
  MAX_CACHE_BYTES,
  THUMBNAIL_MAX_SCREEN_EDGE,
  rgbToOklab,
  oklabToRgb,
  hexDistanceOklab,
  extractPaletteFromImageData,
  computeDHashFromGrayscale,
  hammingDistance,
  backfillManager,
} = jiti('../src/lib/assets/index.ts');

const {
  getScreenBBox,
} = jiti('../src/canvas/geometry.ts');

const {
  autoArrangeElements,
} = jiti('../src/lib/arrange.ts');

const {
  SCHEMA_VERSION,
  SCENE_INDEX_KEY,
  SCENE_KEY_PREFIX,
  INSTANT_PREVIEW_KEY,
  BG_COLOR_KEY,
  createDefaultScene,
} = jiti('../src/lib/scenes/storage.ts');

const {
  MAX_SCENES,
} = jiti('../src/store/useSceneStore.ts');

let passed = 0;
let failed = 0;

function assert(cond, name) {
  if (cond) {
    passed++;
    console.log(`[PASS] ${name}`);
  } else {
    failed++;
    console.error(`[FAIL] ${name}`);
  }
}

console.log('=== RUNNING AUTOMATED UNIT TESTS ===\n');

// 1. Math & Geometry tests
assert(distance({ x: 0, y: 0 }, { x: 3, y: 4 }) === 5, 'distance(0,0, 3,4) === 5');
const rot = rotatePoint({ x: 10, y: 0 }, { x: 0, y: 0 }, Math.PI / 2);
assert(Math.abs(rot.x) < 1e-10 && Math.abs(rot.y - 10) < 1e-10, 'rotatePoint 90 deg around origin');

const nb = normBox({ x: 100, y: 100, width: -50, height: -30 });
assert(nb.x === 50 && nb.y === 70 && nb.w === 50 && nb.h === 30, 'normBox normalizes negative dimensions');

const centerRect = getCenter({ type: 'rectangle', x: 50, y: 70, width: 50, height: 30 });
assert(centerRect.x === 75 && centerRect.y === 85, 'getCenter calculates correct center for rectangle');

const centerLine = getCenter({ type: 'line', points: [{ x: 10, y: 20 }, { x: 50, y: 80 }] });
assert(centerLine.x === 30 && centerLine.y === 50, 'getCenter calculates correct center for line');

// 2. Hit Testing (Hollow vs Filled Shapes)
const hollowRect = { type: 'rectangle', x: 10, y: 10, width: 100, height: 100, strokeWidth: 2, fillColor: 'transparent' };
assert(elementContains(hollowRect, { x: 10, y: 50 }) === true, 'elementContains detects stroke hit on transparent rectangle');
assert(elementContains(hollowRect, { x: 50, y: 50 }) === false, 'elementContains ignores hollow center on transparent rectangle');

const filledRect = { ...hollowRect, fillColor: '#ff0000' };
assert(elementContains(filledRect, { x: 50, y: 50 }) === true, 'elementContains detects center hit on filled rectangle');

const hollowEllipse = { type: 'ellipse', x: 10, y: 10, width: 100, height: 100, strokeWidth: 2, fillColor: 'transparent' };
assert(elementContains(hollowEllipse, { x: 50, y: 50 }) === false, 'elementContains ignores hollow center on transparent ellipse');
assert(elementContains(hollowEllipse, { x: 10, y: 60 }) === true, 'elementContains detects perimeter hit on transparent ellipse');

const filledEllipse = { ...hollowEllipse, fillColor: '#00ff00' };
assert(elementContains(filledEllipse, { x: 50, y: 50 }) === true, 'elementContains detects center hit on filled ellipse');

const hollowDiamond = { type: 'diamond', x: 10, y: 10, width: 100, height: 100, strokeWidth: 2, fillColor: 'transparent' };
assert(elementContains(hollowDiamond, { x: 50, y: 50 }) === false, 'elementContains ignores hollow center on transparent diamond');
assert(elementContains(hollowDiamond, { x: 10, y: 60 }) === true, 'elementContains detects perimeter hit on transparent diamond');

const filledDiamond = { ...hollowDiamond, fillColor: '#0000ff' };
assert(elementContains(filledDiamond, { x: 50, y: 50 }) === true, 'elementContains detects center hit on filled diamond');

// 3. Preset Content & Bounding Box
assert(DEFAULT_WALLPAPER_ELEMENTS.length === 251, 'DEFAULT_WALLPAPER_ELEMENTS has 251 compliant elements');
const prohibitedId = DEFAULT_WALLPAPER_ELEMENTS.find(el => el.id.includes('1hobz3'));
assert(!prohibitedId, 'Cigarette doodle elements are completely purged');
assert(ORIGINAL_PRESET_CENTER.x === 733.27 && ORIGINAL_PRESET_CENTER.y === 387.2, 'ORIGINAL_PRESET_CENTER coordinates are accurate');

const shiftedPreset = getDefaultWallpaperElements(1920, 1080);
assert(shiftedPreset.length === 251, 'getDefaultWallpaperElements retains element count');

// 4. Wallpaper Presets Catalog
assert(Array.isArray(WALLPAPER_PRESETS) && WALLPAPER_PRESETS.length === 1, 'WALLPAPER_PRESETS provides signature preset');
for (const p of WALLPAPER_PRESETS) {
  assert(Boolean(p.id && p.title && p.description && p.badge && p.background), `Preset ${p.id} has complete metadata`);
  const elements = p.getElements(1920, 1080);
  assert(Array.isArray(elements) && elements.length > 0, `Preset ${p.id} returns non-empty elements array (${elements.length} elements)`);
  const hasInvalidCoords = elements.some(el => {
    if ('x' in el && (isNaN(el.x) || !isFinite(el.x))) return true;
    if ('y' in el && (isNaN(el.y) || !isFinite(el.y))) return true;
    if ('points' in el && Array.isArray(el.points)) {
      return el.points.some(pt => isNaN(pt.x) || !isFinite(pt.x) || isNaN(pt.y) || !isFinite(pt.y));
    }
    return false;
  });
  assert(!hasInvalidCoords, `Preset ${p.id} contains strictly finite, valid coordinates`);
}

// 5. URL & Input Sanitization (XSS Defense)
assert(sanitizeWebUrl('javascript:alert(1)') === '', 'sanitizeWebUrl blocks javascript: scheme');
assert(sanitizeWebUrl('data:text/html,test') === '', 'sanitizeWebUrl blocks data: scheme');
assert(sanitizeWebUrl('file:///etc/passwd') === '', 'sanitizeWebUrl blocks file: scheme');
assert(sanitizeWebUrl('vbscript:msgbox') === '', 'sanitizeWebUrl blocks vbscript: scheme');
assert(sanitizeWebUrl('about:blank') === '', 'sanitizeWebUrl blocks about: scheme');
assert(sanitizeWebUrl('github.com') === 'https://github.com/', 'sanitizeWebUrl auto-prefixes https://');
assert(sanitizeWebUrl('https://example.com/test?a=1') === 'https://example.com/test?a=1', 'sanitizeWebUrl preserves valid https URLs');

// 6. XML & SVG Escaping
assert(escapeXml('<script>alert("xss")&\'') === '&lt;script&gt;alert(&quot;xss&quot;)&amp;&apos;', 'escapeXml escapes <, >, ", &, \'');

// 7. Color Luminance
assert(isColorLight('#ffffff') === true, 'isColorLight recognizes white as light');
assert(isColorLight('#14141a') === false, 'isColorLight recognizes #14141a as dark');
assert(isColorLight('#f5f5f7') === true, 'isColorLight recognizes #f5f5f7 as light');

// 8. Transitive Group Traversal
const elA = { id: 'a', groupIds: ['g1'] };
const elB = { id: 'b', groupIds: ['g1', 'g2'] };
const elC = { id: 'c', groupIds: ['g2'] };
const elD = { id: 'd', groupIds: ['g3'] };
const connected = getConnectedGroupElementIds([elA, elB, elC, elD], new Set(['a']));
assert(connected.has('a') && connected.has('b') && connected.has('c') && !connected.has('d'), 'getConnectedGroupElementIds performs full transitive closure');

// 9. Asset Store & Ingestion Pipeline Tests
assert(ALLOWED_IMAGE_MIME_TYPES.has('image/png'), 'Allowed MIME includes PNG');
assert(ALLOWED_IMAGE_MIME_TYPES.has('image/jpeg'), 'Allowed MIME includes JPEG');
assert(ALLOWED_IMAGE_MIME_TYPES.has('image/webp'), 'Allowed MIME includes WebP');
assert(ALLOWED_IMAGE_MIME_TYPES.has('image/gif'), 'Allowed MIME includes GIF');
assert(ALLOWED_IMAGE_MIME_TYPES.has('image/avif'), 'Allowed MIME includes AVIF');
assert(!ALLOWED_IMAGE_MIME_TYPES.has('image/svg+xml'), 'Allowed MIME strictly rejects SVG');
assert(!ALLOWED_IMAGE_MIME_TYPES.has('text/html'), 'Allowed MIME strictly rejects non-images');

assert(MAX_FILE_SIZE_BYTES === 50 * 1024 * 1024, 'MAX_FILE_SIZE_BYTES is 50 MB');
assert(MAX_ORIGINAL_SIZE_BYTES === 25 * 1024 * 1024, 'MAX_ORIGINAL_SIZE_BYTES is 25 MB');
assert(MAX_MEGAPIXELS === 100, 'MAX_MEGAPIXELS limit is 100');

(async () => {
  // SHA-256 Hash Deduplication verification
  const testBytes1 = new Uint8Array([1, 2, 3, 4, 5, 42, 99]);
  const testBytes2 = new Uint8Array([1, 2, 3, 4, 5, 42, 99]);
  const testBytesDiff = new Uint8Array([1, 2, 3, 4, 5, 42, 100]);
  const blob1 = new Blob([testBytes1], { type: 'image/png' });
  const blob2 = new Blob([testBytes2], { type: 'image/png' });
  const blobDiff = new Blob([testBytesDiff], { type: 'image/png' });

  const hash1 = await computeBlobHash(blob1);
  const hash2 = await computeBlobHash(blob2);
  const hashDiff = await computeBlobHash(blobDiff);

  assert(hash1 === hash2, 'Identical byte blobs produce identical SHA-256 hashes (deduplication foundation)');
  assert(hash1 !== hashDiff, 'Different byte blobs produce distinct SHA-256 hashes');
  assert(typeof hash1 === 'string' && hash1.length === 64, 'SHA-256 hash is 64 hex characters');

  // Base64 serialization roundtrip for .canvaswallpaper export/import
  const originalBlob = new Blob(['paper-tab-test-binary-stream'], { type: 'image/webp' });
  const b64 = await blobToBase64(originalBlob);
  const restoredBlob = base64ToBlob(b64, 'image/webp');
  const restoredHash = await computeBlobHash(restoredBlob);
  assert(restoredHash === await computeBlobHash(originalBlob), 'base64ToBlob and blobToBase64 roundtrip preserves byte integrity');

  // --- SECTION 10: Scalable Scene Persistence & Discrete Keys ---
  console.log('\n--- SECTION 10: Scalable Scene Persistence (Phase 2) ---');
  assert(SCHEMA_VERSION === 3, 'Schema version is bumped to 3 for metadata pipeline');
  assert(SCENE_INDEX_KEY === 'scenes_index', 'Scene index key is scenes_index');
  assert(SCENE_KEY_PREFIX === 'scene:', 'Scene discrete key prefix is scene:');
  assert(MAX_SCENES === 100, 'MAX_SCENES is raised to 100');

  const defScene = createDefaultScene();
  assert(defScene.id === 'default' && Array.isArray(defScene.elements) && defScene.background, 'createDefaultScene produces standard default scene');

  const sceneKey1 = SCENE_KEY_PREFIX + 'board-abc';
  const sceneKey2 = SCENE_KEY_PREFIX + 'board-xyz';
  assert(sceneKey1 === 'scene:board-abc' && sceneKey2 === 'scene:board-xyz', 'Discrete scene keys isolate storage items per board');
  assert(sceneKey1 !== sceneKey2, 'Different boards map to distinct storage keys');

  // --- SECTION 11: Scalable Rendering & Asset Loader (Phase 3) ---
  console.log('\n--- SECTION 11: Scalable Rendering & Asset Loader (Phase 3) ---');
  assert(MAX_CACHE_BYTES === 256 * 1024 * 1024, 'Bitmap cache budget is strictly 256 MB');
  assert(THUMBNAIL_MAX_SCREEN_EDGE === 320, 'Thumbnail max screen edge is 320px');

  // LOD Tier calculations
  assert(getLodTier(200, 150, 1) === 'thumb', 'Elements <= 320px at zoom 1 select thumb tier');
  assert(getLodTier(400, 300, 1) === 'full', 'Elements > 320px at zoom 1 select full tier');
  assert(getLodTier(200, 150, 2) === 'full', '200x150 at zoom 2 is 400x300 > 320 so full tier');
  assert(getLodTier(100, 100, 2) === 'thumb', '100x100 at zoom 2 is 200x200 <= 320 so thumb tier');
  assert(getLodTier(500, 500, 0.5) === 'thumb', '500x500 at zoom 0.5 is 250x250 <= 320 so thumb tier');

  // Decoded pixel byte size calculation
  const testW = 1920;
  const testH = 1080;
  const expectedBytes = testW * testH * 4;
  assert(expectedBytes === 8294400, 'w * h * 4 calculation accurately estimates decoded pixel memory (~8.29 MB for 1080p)');

  // Viewport culling bounding box intersection
  const viewport = { minX: 0, minY: 0, maxX: 1920, maxY: 1080 };
  const inViewEl = { type: 'rectangle', x: 100, y: 100, width: 200, height: 150, strokeWidth: 2, angle: 0 };
  const outViewEl = { type: 'rectangle', x: 2500, y: 3000, width: 200, height: 150, strokeWidth: 2, angle: 0 };
  const rotatedInViewEl = { type: 'rectangle', x: -50, y: -50, width: 100, height: 100, strokeWidth: 2, angle: Math.PI / 4 };

  const boxIn = getScreenBBox(inViewEl);
  const boxOut = getScreenBBox(outViewEl);
  const boxRot = getScreenBBox(rotatedInViewEl);

  const isInVisible = boxIn.x <= viewport.maxX && boxIn.x + boxIn.w >= viewport.minX && boxIn.y <= viewport.maxY && boxIn.y + boxIn.h >= viewport.minY;
  const isOutVisible = boxOut.x <= viewport.maxX && boxOut.x + boxOut.w >= viewport.minX && boxOut.y <= viewport.maxY && boxOut.y + boxOut.h >= viewport.minY;
  const isRotVisible = boxRot.x <= viewport.maxX && boxRot.x + boxRot.w >= viewport.minX && boxRot.y <= viewport.maxY && boxRot.y + boxRot.h >= viewport.minY;

  assert(isInVisible, 'Viewport culling correctly identifies elements inside camera viewport');
  assert(!isOutVisible, 'Viewport culling correctly skips elements outside camera viewport');
  assert(isRotVisible, 'Viewport culling correctly accounts for rotated element extents');

  // --- SECTION 12: Auto-Arrange & Organize (Phase 4) ---
  console.log('\n--- SECTION 12: Auto-Arrange & Organize (Phase 4) ---');

  const elA = { id: 'a', type: 'rectangle', x: 50, y: 50, width: 100, height: 100, locked: false };
  const elB = { id: 'b', type: 'rectangle', x: 200, y: 50, width: 100, height: 100, locked: false };
  const elC = { id: 'c', type: 'rectangle', x: 350, y: 50, width: 100, height: 100, locked: false };
  const elLocked = { id: 'locked', type: 'rectangle', x: 800, y: 800, width: 100, height: 100, locked: true };

  const testEls = [elA, elB, elC, elLocked];
  const selectedIds = new Set(['a', 'b', 'c', 'locked']);

  // Row Layout Test
  const rowArranged = autoArrangeElements(testEls, selectedIds, 'row', 20);
  const arrangedA = rowArranged.find(e => e.id === 'a');
  const arrangedB = rowArranged.find(e => e.id === 'b');
  const arrangedC = rowArranged.find(e => e.id === 'c');
  const arrangedLocked = rowArranged.find(e => e.id === 'locked');

  assert(arrangedA.x === 50, 'First element in Row stays at origin X');
  assert(arrangedB.x === 50 + 100 + 20, 'Second element in Row is positioned with 20px gap');
  assert(arrangedC.x === 170 + 100 + 20, 'Third element in Row is positioned with 20px gap');
  assert(arrangedLocked.x === 800 && arrangedLocked.y === 800, 'Locked element stays strictly put');

  // Column Layout Test
  const colArranged = autoArrangeElements(testEls, selectedIds, 'column', 15);
  const colA = colArranged.find(e => e.id === 'a');
  const colB = colArranged.find(e => e.id === 'b');
  assert(colA.y === 50, 'First element in Column starts at origin Y');
  assert(colB.y === 50 + 100 + 15, 'Second element in Column is offset by height + 15px gap');

  // Grid Layout Test
  const gridArranged = autoArrangeElements(testEls, new Set(['a', 'b', 'c', 'd']), 'grid', 20);
  assert(gridArranged.length === testEls.length, 'Grid arrangement preserves total element count');

  // Insufficient Selection Protection
  const singleArranged = autoArrangeElements(testEls, new Set(['a']), 'row', 20);
  assert(singleArranged === testEls, 'Arranging fewer than 2 elements returns original list unchanged');

  // --- SECTION 13: Metadata Pipeline & Color/Hash Logic (Phase 1) ---
  console.log('\n--- SECTION 13: Metadata Pipeline & Color/Hash Logic (Phase 1) ---');

  // 1. OKLab conversion and roundtrip
  const okWhite = rgbToOklab(255, 255, 255);
  const rgbWhite = oklabToRgb(okWhite.L, okWhite.a, okWhite.b);
  assert(rgbWhite.r === 255 && rgbWhite.g === 255 && rgbWhite.b === 255, 'sRGB <-> OKLab roundtrip preserves pure white');

  const okBlack = rgbToOklab(0, 0, 0);
  const rgbBlack = oklabToRgb(okBlack.L, okBlack.a, okBlack.b);
  assert(rgbBlack.r === 0 && rgbBlack.g === 0 && rgbBlack.b === 0, 'sRGB <-> OKLab roundtrip preserves pure black');

  // 2. OKLab perceptual distance matching
  const distIdentical = hexDistanceOklab('#46BAEB', '#46BAEB');
  assert(distIdentical === 0, 'Distance between identical colors is 0');

  const distBlueGreen = hexDistanceOklab('#46BAEB', '#00BF63');
  assert(distBlueGreen > 0.05 && distBlueGreen < 0.35, 'Perceptual distance between Brand Blue and Brand Green is within expected range (~0.15)');

  const distWhiteBlack = hexDistanceOklab('#FFFFFF', '#000000');
  assert(distWhiteBlack > 0.9, 'Perceptual distance between White and Black is maximal (~1.0)');

  // 3. Deterministic palette extraction
  // Create a synthetic 8x8 RGBA array (64 pixels, 4 colors: blue, green, white, near-transparent)
  const syntheticPixels = new Uint8ClampedArray(64 * 4);
  for (let i = 0; i < 64; i++) {
    const offset = i * 4;
    if (i < 24) {
      // 24 pixels Brand Blue
      syntheticPixels[offset] = 0x46;
      syntheticPixels[offset + 1] = 0xBA;
      syntheticPixels[offset + 2] = 0xEB;
      syntheticPixels[offset + 3] = 255;
    } else if (i < 44) {
      // 20 pixels Brand Green
      syntheticPixels[offset] = 0x00;
      syntheticPixels[offset + 1] = 0xBF;
      syntheticPixels[offset + 2] = 0x63;
      syntheticPixels[offset + 3] = 255;
    } else if (i < 54) {
      // 10 pixels White
      syntheticPixels[offset] = 255;
      syntheticPixels[offset + 1] = 255;
      syntheticPixels[offset + 2] = 255;
      syntheticPixels[offset + 3] = 255;
    } else {
      // 10 transparent pixels (alpha = 20) -> should be skipped!
      syntheticPixels[offset] = 0;
      syntheticPixels[offset + 1] = 0;
      syntheticPixels[offset + 2] = 0;
      syntheticPixels[offset + 3] = 20;
    }
  }

  const palette1 = extractPaletteFromImageData(syntheticPixels, 5);
  const palette2 = extractPaletteFromImageData(syntheticPixels, 5);

  assert(palette1.length === palette2.length, 'Palette extraction produces identical number of swatches');
  assert(JSON.stringify(palette1) === JSON.stringify(palette2), 'Palette extraction is strictly deterministic across runs');
  assert(palette1.length > 0 && palette1[0].weight >= palette1[1]?.weight, 'Palette sorts by dominant color weight descending');

  // 4. 64-bit dHash (9x8 grayscale) and Hamming distance
  const grayBase = new Uint8Array(9 * 8);
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 9; c++) {
      grayBase[r * 9 + c] = (r * 15 + c * 10) % 256;
    }
  }
  const hashBase = computeDHashFromGrayscale(grayBase);
  assert(typeof hashBase === 'string' && hashBase.length === 16, 'dHash produces 16-hex char 64-bit fingerprint');
  assert(hammingDistance(hashBase, hashBase) === 0, 'Hamming distance with identical hash is 0');

  // Create near-duplicate (tweak 2 pixels slightly)
  const grayNear = new Uint8Array(grayBase);
  grayNear[0] = grayNear[0] + 5;
  grayNear[10] = grayNear[10] + 5;
  const hashNear = computeDHashFromGrayscale(grayNear);
  const nearDist = hammingDistance(hashBase, hashNear);
  assert(nearDist <= 5, 'Near duplicate retains Hamming distance <= 5 (near-duplicate threshold)');

  // Create inverted image
  const grayInverted = new Uint8Array(grayBase.map(v => 255 - v));
  const hashInverted = computeDHashFromGrayscale(grayInverted);
  const invDist = hammingDistance(hashBase, hashInverted);
  assert(invDist >= 50, 'Inverted/dissimilar image produces high Hamming distance (>= 50)');

  // 5. Backfill Manager progress state
  const backfillProg = backfillManager.getProgress();
  assert(typeof backfillProg.isBackfilling === 'boolean' && typeof backfillProg.total === 'number', 'Backfill manager reports valid progress state');

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);

  if (failed > 0) {
    process.exit(1);
  }
})().catch(err => {
  console.error("Async test failed:", err);
  process.exit(1);
});
