import { crc32 } from "./crc32";

export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

interface InternalRecord {
  pathBytes: Uint8Array;
  crc: number;
  size: number;
  offset: number;
}

export class ZipWriter {
  private chunks: Uint8Array[] = [];
  private records: InternalRecord[] = [];
  private currentOffset = 0;

  /**
   * Adds a file entry to the ZIP archive (Stored mode: compression = 0).
   */
  public addFile(path: string, content: Uint8Array | string): void {
    const cleanPath = path.replace(/\\/g, "/");
    const encoder = new TextEncoder();
    const pathBytes = encoder.encode(cleanPath);

    const data: Uint8Array =
      typeof content === "string" ? encoder.encode(content) : content;

    const crc = crc32(data);
    const size = data.length;
    const offset = this.currentOffset;

    // 1. Local File Header (30 bytes + path length)
    const localHeader = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 10, true); // Version needed to extract (1.0)
    view.setUint16(6, 0x0800, true); // UTF-8 filename flag (bit 11)
    view.setUint16(8, 0, true); // Compression method: 0 (Stored)
    view.setUint16(10, 0, true); // Last mod file time
    view.setUint16(12, 0, true); // Last mod file date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, size, true); // Compressed size
    view.setUint32(22, size, true); // Uncompressed size
    view.setUint16(26, pathBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length

    localHeader.set(pathBytes, 30);

    this.chunks.push(localHeader);
    this.chunks.push(data);
    this.currentOffset += localHeader.length + size;

    this.records.push({
      pathBytes,
      crc,
      size,
      offset,
    });
  }

  /**
   * Finalizes the ZIP archive and returns a standard Blob.
   */
  public toBlob(): Blob {
    const centralDirectoryStart = this.currentOffset;
    const cdChunks: Uint8Array[] = [];

    // 2. Central Directory Headers
    for (const rec of this.records) {
      const cdHeader = new Uint8Array(46 + rec.pathBytes.length);
      const view = new DataView(cdHeader.buffer);

      view.setUint32(0, 0x02014b50, true); // Central file header signature
      view.setUint16(4, 20, true); // Version made by (2.0)
      view.setUint16(6, 10, true); // Version needed to extract (1.0)
      view.setUint16(8, 0x0800, true); // UTF-8 filename flag (bit 11)
      view.setUint16(10, 0, true); // Compression method: 0 (Stored)
      view.setUint16(12, 0, true); // Last mod file time
      view.setUint16(14, 0, true); // Last mod file date
      view.setUint32(16, rec.crc, true); // CRC-32
      view.setUint32(20, rec.size, true); // Compressed size
      view.setUint32(24, rec.size, true); // Uncompressed size
      view.setUint16(28, rec.pathBytes.length, true); // File name length
      view.setUint16(30, 0, true); // Extra field length
      view.setUint16(32, 0, true); // File comment length
      view.setUint16(34, 0, true); // Disk number start
      view.setUint16(36, 0, true); // Internal file attributes
      view.setUint32(38, 0, true); // External file attributes
      view.setUint32(42, rec.offset, true); // Relative offset of local header

      cdHeader.set(rec.pathBytes, 46);
      cdChunks.push(cdHeader);
      this.currentOffset += cdHeader.length;
    }

    const centralDirectorySize = this.currentOffset - centralDirectoryStart;

    // 3. End of Central Directory Record (22 bytes)
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);

    eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
    eocdView.setUint16(4, 0, true); // Number of this disk
    eocdView.setUint16(6, 0, true); // Disk where central directory starts
    eocdView.setUint16(8, this.records.length, true); // Number of central directory records on this disk
    eocdView.setUint16(10, this.records.length, true); // Total number of central directory records
    eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
    eocdView.setUint32(16, centralDirectoryStart, true); // Offset of start of central directory
    eocdView.setUint16(20, 0, true); // ZIP file comment length

    const allParts = [...this.chunks, ...cdChunks, eocd];
    return new Blob(allParts as BlobPart[], { type: "application/zip" });
  }

  /**
   * Finalizes the ZIP archive and returns a contiguous Uint8Array.
   */
  public toUint8Array(): Uint8Array {
    const blob = this.toBlob();
    // In environments with sync access or for test convenience
    const totalLength = this.chunks.reduce((acc, c) => acc + c.length, 0);
    // Build Uint8Array synchronously
    const centralDirectoryStart = totalLength;
    const cdChunks: Uint8Array[] = [];
    let cdOffsetCounter = totalLength;

    for (const rec of this.records) {
      const cdHeader = new Uint8Array(46 + rec.pathBytes.length);
      const view = new DataView(cdHeader.buffer);

      view.setUint32(0, 0x02014b50, true);
      view.setUint16(4, 20, true);
      view.setUint16(6, 10, true);
      view.setUint16(8, 0x0800, true);
      view.setUint16(10, 0, true);
      view.setUint16(12, 0, true);
      view.setUint16(14, 0, true);
      view.setUint32(16, rec.crc, true);
      view.setUint32(20, rec.size, true);
      view.setUint32(24, rec.size, true);
      view.setUint16(28, rec.pathBytes.length, true);
      view.setUint16(30, 0, true);
      view.setUint16(32, 0, true);
      view.setUint16(34, 0, true);
      view.setUint16(36, 0, true);
      view.setUint32(38, 0, true);
      view.setUint32(42, rec.offset, true);

      cdHeader.set(rec.pathBytes, 46);
      cdChunks.push(cdHeader);
      cdOffsetCounter += cdHeader.length;
    }

    const centralDirectorySize = cdOffsetCounter - centralDirectoryStart;

    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true);
    eocdView.setUint16(4, 0, true);
    eocdView.setUint16(6, 0, true);
    eocdView.setUint16(8, this.records.length, true);
    eocdView.setUint16(10, this.records.length, true);
    eocdView.setUint32(12, centralDirectorySize, true);
    eocdView.setUint32(16, centralDirectoryStart, true);
    eocdView.setUint16(20, 0, true);

    const fullSize = cdOffsetCounter + 22;
    const result = new Uint8Array(fullSize);
    let pos = 0;
    for (const chunk of this.chunks) {
      result.set(chunk, pos);
      pos += chunk.length;
    }
    for (const chunk of cdChunks) {
      result.set(chunk, pos);
      pos += chunk.length;
    }
    result.set(eocd, pos);

    return result;
  }
}
