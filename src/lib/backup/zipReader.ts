import { crc32 } from "./crc32";

export const MAX_BACKUP_ENTRIES = 5000;
export const MAX_BACKUP_TOTAL_BYTES = 1024 * 1024 * 1024; // 1 GB zip bomb protection

export class ZipReader {
  private buffer: Uint8Array;
  private view: DataView;

  constructor(data: Uint8Array | ArrayBuffer) {
    if (data instanceof Uint8Array) {
      this.buffer = data;
    } else {
      this.buffer = new Uint8Array(data);
    }
    this.view = new DataView(
      this.buffer.buffer,
      this.buffer.byteOffset,
      this.buffer.byteLength,
    );
  }

  /**
   * Scans and extracts all files from the ZIP archive, applying path safety
   * and zip bomb size caps.
   */
  public extractAll(): Map<string, Uint8Array> {
    const eocdOffset = this.findEOCD();
    if (eocdOffset < 0) {
      throw new Error("Invalid ZIP archive: End of Central Directory record not found.");
    }

    const totalEntries = this.view.getUint16(eocdOffset + 10, true);
    const cdSize = this.view.getUint32(eocdOffset + 12, true);
    const cdOffset = this.view.getUint32(eocdOffset + 16, true);

    if (totalEntries > MAX_BACKUP_ENTRIES) {
      throw new Error(
        `Zip entry count (${totalEntries}) exceeds safety limit of ${MAX_BACKUP_ENTRIES}.`,
      );
    }

    if (cdOffset + cdSize > this.buffer.length) {
      throw new Error("Invalid ZIP archive: Central directory points outside buffer.");
    }

    const decoder = new TextDecoder();
    const result = new Map<string, Uint8Array>();
    let offset = cdOffset;
    let totalUncompressedBytes = 0;

    for (let i = 0; i < totalEntries; i++) {
      if (offset + 46 > this.buffer.length) {
        throw new Error("Truncated Central Directory header in ZIP.");
      }

      const sig = this.view.getUint32(offset, true);
      if (sig !== 0x02014b50) {
        throw new Error(`Corrupted Central Directory signature at offset ${offset}.`);
      }

      const compressionMethod = this.view.getUint16(offset + 10, true);
      const expectedCrc = this.view.getUint32(offset + 16, true);
      const compressedSize = this.view.getUint32(offset + 20, true);
      const uncompressedSize = this.view.getUint32(offset + 24, true);
      const nameLength = this.view.getUint16(offset + 28, true);
      const extraLength = this.view.getUint16(offset + 30, true);
      const commentLength = this.view.getUint16(offset + 32, true);
      const localHeaderOffset = this.view.getUint32(offset + 42, true);

      totalUncompressedBytes += uncompressedSize;
      if (totalUncompressedBytes > MAX_BACKUP_TOTAL_BYTES) {
        throw new Error(
          `Total uncompressed ZIP size exceeds safe limit of ${MAX_BACKUP_TOTAL_BYTES / 1024 / 1024} MB.`,
        );
      }

      const nameBytes = this.buffer.subarray(offset + 46, offset + 46 + nameLength);
      const rawPath = decoder.decode(nameBytes);
      const normalizedPath = rawPath.replace(/\\/g, "/");

      // Path traversal and absolute path safety guards
      if (
        normalizedPath.includes("..") ||
        normalizedPath.startsWith("/") ||
        /^[a-zA-Z]:/.test(normalizedPath)
      ) {
        throw new Error(
          `Security violation: Dangerous path in ZIP entry rejected (${rawPath}).`,
        );
      }

      // Read local header and payload
      if (localHeaderOffset + 30 > this.buffer.length) {
        throw new Error(`Local file header out of bounds for ${normalizedPath}.`);
      }

      const localSig = this.view.getUint32(localHeaderOffset, true);
      if (localSig !== 0x04034b50) {
        throw new Error(`Corrupted Local File Header signature for ${normalizedPath}.`);
      }

      const localNameLen = this.view.getUint16(localHeaderOffset + 26, true);
      const localExtraLen = this.view.getUint16(localHeaderOffset + 28, true);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;

      if (dataStart + uncompressedSize > this.buffer.length) {
        throw new Error(`File payload truncated for ${normalizedPath}.`);
      }

      if (compressionMethod !== 0) {
        throw new Error(
          `Unsupported compression method (${compressionMethod}) for ${normalizedPath}. Only stored (0) archives are supported.`,
        );
      }

      const fileData = this.buffer.subarray(dataStart, dataStart + uncompressedSize);

      // Verify CRC-32 integrity
      const actualCrc = crc32(fileData);
      if (actualCrc !== expectedCrc) {
        throw new Error(
          `CRC-32 checksum mismatch for ${normalizedPath} (expected: 0x${expectedCrc.toString(16)}, got: 0x${actualCrc.toString(16)}).`,
        );
      }

      // Skip directory entries (paths ending in /)
      if (!normalizedPath.endsWith("/")) {
        result.set(normalizedPath, fileData);
      }

      offset += 46 + nameLength + extraLength + commentLength;
    }

    return result;
  }

  /**
   * Scans backwards for the End of Central Directory signature (0x06054b50).
   */
  private findEOCD(): number {
    const minEocdSize = 22;
    const maxCommentSize = 65535;
    const maxSearchRange = Math.min(
      this.buffer.length,
      minEocdSize + maxCommentSize,
    );
    const searchStart = this.buffer.length - minEocdSize;
    const searchEnd = this.buffer.length - maxSearchRange;

    for (let pos = searchStart; pos >= searchEnd; pos--) {
      if (this.view.getUint32(pos, true) === 0x06054b50) {
        return pos;
      }
    }

    return -1;
  }
}
