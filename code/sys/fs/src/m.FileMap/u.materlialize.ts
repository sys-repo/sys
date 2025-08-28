import { type t, Fs, Path } from './common.ts';
import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';

export async function materialize(
  map: t.FileMap,
  dir: t.StringDir,
  options: t.FileMapMaterializeOptions = {},
): Promise<t.FileMapMaterializeResult> {
  const { force = false, ctx, processFile, onLog } = options;
  const ops: Array<{ kind: 'write' | 'skip' | 'rename' | 'modify'; path: string; note?: string }> =
    [];

  for (const [origKey, dataUri] of Object.entries(map)) {
    let relative = origKey as t.StringPath;

    // Decode payload
    const contentType = Data.contentType.fromUri(dataUri as t.StringUri);
    const decoded = Data.decode(dataUri as t.StringUri);

    // Normalize shape based on MIME (not on typeof decoded).
    const isText = Is.contentType.string(contentType);
    let text: string | undefined;
    let bytes: Uint8Array | undefined;

    if (isText) {
      if (typeof decoded === 'string') {
        text = decoded;
      } else {
        text = new TextDecoder().decode(decoded);
      }
    } else {
      if (typeof decoded === 'string') {
        // Defensive: should rarely happen, but normalize to bytes.
        bytes = new TextEncoder().encode(decoded);
      } else {
        bytes = decoded;
      }
    }

    // Mutability flags
    let excluded = false;
    let excludeNote: string | undefined;
    let modified = false;

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
          relative = next as t.StringPath;
          ops.push({ kind: 'rename', path: relative });
        },
      },
      ctx,
      exclude(reason?: string) {
        excluded = true;
        excludeNote = reason;
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

    // Host transforms
    if (processFile) {
      await processFile(event);
      if (excluded) {
        onLog?.(`skip ${relative}${excludeNote ? ` — ${excludeNote}` : ''}`);
        ops.push({ kind: 'skip', path: relative, note: excludeNote });
        continue;
      }
    }

    // Overwrite guard
    if (!force && (await exists())) {
      onLog?.(`skip ${relative} — exists`);
      ops.push({ kind: 'skip', path: relative, note: 'exists' });
      continue;
    }

    // Ensure directory and write
    await Fs.ensureDir(Path.dirname(absolute()));
    const outBytes = isText ? new TextEncoder().encode(text ?? '') : bytes ?? new Uint8Array();
    await Fs.write(absolute(), outBytes);

    onLog?.(`write ${relative}${modified ? ' (modified)' : ''}`);
    ops.push({ kind: 'write', path: relative });
  }

  return { ops };
}
