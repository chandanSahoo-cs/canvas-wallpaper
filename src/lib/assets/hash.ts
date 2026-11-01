/**
 * Perceptual Hash (64-bit dHash: Difference Hash, 9x8 grayscale) and Hamming distance.
 * Fast, rotation/brightness-tolerant image fingerprinting.
 */

/**
 * Computes 64-bit dHash from 9x8 image pixel data.
 * Grayscale formula: 0.299*R + 0.587*G + 0.114*B.
 * Returns a 16-character lowercase hex string.
 */
export function computeDHashFromGrayscale(gray9x8: Uint8Array | number[]): string {
  // 9 wide, 8 high -> 8 rows of 8 column comparisons = 64 bits
  let hexStr = "";

  for (let row = 0; row < 8; row++) {
    let rowByte = 0;
    for (let col = 0; col < 8; col++) {
      const idx = row * 9 + col;
      const left = gray9x8[idx];
      const right = gray9x8[idx + 1];
      const bit = left > right ? 1 : 0;
      rowByte = (rowByte << 1) | bit;
    }
    hexStr += rowByte.toString(16).padStart(2, "0");
  }

  return hexStr.toLowerCase();
}

/**
 * Extract 9x8 grayscale values from 9x8 RGBA ImageData and compute dHash.
 */
export function computeDHashFromImageData(rgbaData: Uint8ClampedArray): string {
  if (rgbaData.length < 9 * 8 * 4) {
    return "0000000000000000";
  }

  const gray = new Uint8Array(9 * 8);
  for (let i = 0; i < 9 * 8; i++) {
    const r = rgbaData[i * 4];
    const g = rgbaData[i * 4 + 1];
    const b = rgbaData[i * 4 + 2];
    gray[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }

  return computeDHashFromGrayscale(gray);
}

/**
 * Computes Hamming distance (number of bit differences) between two 64-bit hex dHashes.
 * Distance range: 0 (identical) to 64 (opposite).
 * Near duplicates have distance <= 5.
 */
export function hammingDistance(hashA: string, hashB: string): number {
  if (!hashA || !hashB || hashA.length !== 16 || hashB.length !== 16) {
    return 64;
  }

  let distance = 0;
  for (let i = 0; i < 16; i += 2) {
    const byteA = parseInt(hashA.substring(i, i + 2), 16) || 0;
    const byteB = parseInt(hashB.substring(i, i + 2), 16) || 0;
    let xor = byteA ^ byteB;

    // Brian Kernighan bit count
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }

  return distance;
}
