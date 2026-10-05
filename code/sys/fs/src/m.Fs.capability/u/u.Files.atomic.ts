import { slug, type t } from '../common.ts';

const TEMP_PREFIX = '.sys-files-atomic-';
const TEMP_SUFFIX = '.tmp';

/** Atomically replace a complete file value using a same-directory temp file and rename. */
export async function writeFileAtomic(
  fs: t.Fs.Lib,
  path: t.StringPath,
  content: Uint8Array,
  _options: t.FsCapability.Files.WriteFileOptions = {},
): Promise<void> {
  const target = fs.resolve(path);
  const parent = fs.dirname(target);
  await fs.ensureDir(parent);

  const temp = fs.join(parent, `${TEMP_PREFIX}${slug()}${TEMP_SUFFIX}`);
  let created = false;
  try {
    await writeCompleteTemp(temp, content);
    created = true;
    await fs.rename(temp, target);
  } catch (cause) {
    if (created) await removeTemp(temp).catch(() => undefined);
    throw cause;
  }
}

/** True when a backing path is an internal atomic-write temp artifact. */
export function isAtomicTempPath(fs: t.Fs.Lib, path: t.StringPath): boolean {
  const name = fs.basename(path);
  return name.startsWith(TEMP_PREFIX) && name.endsWith(TEMP_SUFFIX);
}

async function writeCompleteTemp(path: t.StringPath, content: Uint8Array): Promise<void> {
  const file = await Deno.open(path, { write: true, createNew: true });
  let failure: unknown;
  try {
    let offset = 0;
    while (offset < content.byteLength) {
      const written = await file.write(content.subarray(offset));
      if (written === 0) throw new Error(`Atomic write made no forward progress: ${path}`);
      offset += written;
    }
    await file.sync();
  } catch (cause) {
    failure = cause;
  } finally {
    file.close();
  }

  if (failure) {
    await removeTemp(path).catch(() => undefined);
    throw failure;
  }
}

async function removeTemp(path: t.StringPath): Promise<void> {
  try {
    await Deno.remove(path);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return;
    throw error;
  }
}
