import fs from 'node:fs';
import crypto from 'node:crypto';

/**
 * Computes the SHA-256 checksum of a file located at the given path and returns it as a Buffer.
 *
 * @param path The path to the file for which the checksum is to be computed.
 * @return A promise that resolves to a Buffer containing the computed checksum.
 */
export function computeFileChecksumBuffer(path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const rs = fs.createReadStream(path);
    rs.on('error', reject);
    rs.on('data', (chunk) => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest()));
  });
}

/**
 * Computes the SHA-256 checksum of the provided data buffer.
 *
 * @param data - The data for which the checksum is to be computed, provided as an ArrayBuffer.
 * @return A Buffer containing the SHA-256 checksum of the input data.
 */
export function computeChecksumBuffer(data: ArrayBuffer): Buffer {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(data));
  return hash.digest();
}
