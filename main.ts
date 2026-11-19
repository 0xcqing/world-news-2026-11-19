/**
 * make.fun competition entry — news-image-20261119
 *
 * Publishes the finished poster (entry.png) to a writable output directory.
 * The source image lives next to this module, so it is resolved through
 * import.meta.url and works no matter where the repository is mounted.
 * Standard library only: no third-party packages, no network access.
 */

import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1024 * 1024; // 1 MiB

async function main(): Promise<void> {
  // Resolve entry.png relative to this module, never via a hard-coded path.
  const moduleDir = dirname(fileURLToPath(import.meta.url));
  const source = join(moduleDir, 'entry.png');

  // The grader usually mounts the repo read-only, so writes go elsewhere.
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  const target = join(outputDir, 'entry.png');

  await mkdir(outputDir, { recursive: true });
  await copyFile(source, target);

  // Re-read what was actually written and validate it before declaring success.
  const written = await readFile(target);
  const hasPngSignature =
    written.length >= PNG_SIGNATURE.length &&
    written.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE);

  if (!hasPngSignature) {
    throw new Error(`${target} does not start with the 8-byte PNG signature`);
  }
  if (written.length > MAX_BYTES) {
    throw new Error(`${target} is ${written.length} bytes, above the 1 MiB limit`);
  }

  console.log(`Wrote ${written.length} bytes to ${target}`);
}

main().catch((error: unknown) => {
  console.error('Failed to publish entry.png:', error);
  process.exitCode = 1;
});
