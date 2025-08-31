import { type t, Fs, Path } from './common.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { validate } from './u.validate.ts';

export async function materialize(
  map: t.FileMap,
  dir: t.StringDir,
  options: t.FileMapMaterializeOptions = {},
): Promise<t.FileMapMaterializeResult> {
  const { force = false, ctx, processFile, onLog } = options;

  // Validate the input FileMap once (fail fast with a clear error):
  const parsed = validate(map);
  if (parsed.error) throw parsed.error;
  map = parsed.fileMap!;

  const ops: t.FileMapMaterializeOp[] = [];
  for (const [origKey, dataUri] of Object.entries(map)) {
    let relative = origKey as t.StringPath;

    // Decode payload → normalize shape (text vs binary) by MIME.
    const contentType = Data.contentType.fromUri(dataUri as t.StringUri);
    const decoded = Data.decode(dataUri as t.StringUri);

    const isText = Is.contentType.string(contentType);
    let text: string | undefined;
    let bytes: Uint8Array | undefined;

    if (isText) {
      text = typeof decoded === 'string' ? decoded : new TextDecoder().decode(decoded);
      bytes = undefined;
    } else {
      bytes = typeof decoded === 'string' ? new TextEncoder().encode(decoded) : decoded;
      text = undefined;
    }

    // Mutability flags for host processing:
    let excluded = false;
    let modified = false;
    let excludeReason: string | undefined;

    const absolute = () => Path.resolve(Path.join(dir, relative));
    const exists = async () => (await Fs.exists(absolute())) === true;

    const event: t.FileMapProcessEvent = {
      path: origKey as t.StringPath,
      contentType,
      text,
      bytes,
      target: {
        dir,
        get absolute() {
          return absolute();
        },
        get relative() {
          return relative;
        },
        async exists() {
          return exists();
        },
        rename(next: string) {
          const from = relative;
          relative = next as t.StringPath;
          ops.push({ kind: 'rename', from, to: relative });
        },
      },
      ctx,
      exclude(reason?: string) {
        excluded = true;
        excludeReason = reason;
      },
      modify(next: string | Uint8Array) {
        modified = true;
        if (isText) {
          text = typeof next === 'string' ? next : new TextDecoder().decode(next);
          bytes = undefined;
        } else {
          bytes = typeof next === 'string' ? new TextEncoder().encode(next) : next;
          text = undefined;
        }
        ops.push({ kind: 'modify', path: relative });
      },
    };

    // Host transforms:
    if (processFile) {
      await processFile(event);
      if (excluded) {
        onLog?.(`skip ${relative}${excludeReason ? ` — ${excludeReason}` : ''}`);
        ops.push({ kind: 'skip', path: relative });
        continue;
      }
    }

    // Overwrite guard:
    if (!force && (await exists())) {
      onLog?.(`skip ${relative} — exists`);
      ops.push({ kind: 'skip', path: relative });
      continue;
    }

    // Ensure directory and write:
    await Fs.ensureDir(Path.dirname(absolute()));
    const outBytes = isText ? new TextEncoder().encode(text ?? '') : bytes ?? new Uint8Array();
    await Fs.write(absolute(), outBytes);

    onLog?.(`write ${relative}${modified ? ' (modified)' : ''}`);
    ops.push({ kind: 'write', path: relative });
  }

  return { ops };
}
