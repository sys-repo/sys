import { type t, Delete, Fs, Path } from './common.ts';

import { Data } from './m.Data.ts';
import { Is } from './m.Is.ts';
import { validate } from './u.validate.ts';

export async function write(
  map: t.FileMap,
  dir: t.StringDir,
  options: t.FileMapWriteOptions = {},
): Promise<t.FileMapWriteResult> {
  const { force = false, dryRun = false, ctx, processFile } = options;

  // Validate the input FileMap once (fail fast with a clear error):
  const parsed = validate(map);
  if (parsed.error) throw parsed.error;
  map = parsed.fileMap!;

  const ops: t.FileMapOp[] = [];
  const pushOp = (op: t.FileMapOp, forced?: boolean) => {
    op = {
      ...op,
      forced: forced === true ? true : undefined,
      dryRun: dryRun ? true : undefined,
    };
    ops.push(Delete.undefined(op));
  };

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
    let skipped = false;
    let skippedReason: string | undefined;
    let prevPath: t.StringPath | undefined; // ← for rename modifications.
    let changed = false; //                    ← set true if processFile calls e.modify().

    const absolute = () => Path.resolve(Path.join(dir, relative));
    const exists = async () => (await Fs.exists(absolute())) === true;

    const args: t.FileMapProcessorArgs = {
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
        get filename() {
          return Path.basename(relative);
        },
        async exists() {
          return exists();
        },
        rename(next) {
          prevPath = relative;
          relative = next as t.StringPath;
        },
      },
      ctx,
      skip(reason?: string) {
        skipped = true;
        skippedReason = reason;
      },
      modify(next: string | Uint8Array) {
        changed = true;
        if (isText) {
          text = typeof next === 'string' ? next : new TextDecoder().decode(next);
          bytes = undefined;
        } else {
          bytes = typeof next === 'string' ? new TextEncoder().encode(next) : next;
          text = undefined;
        }
      },
    };

    // Host transforms:
    if (processFile) {
      await processFile(args);
    }

    // Existence check at the final (possibly renamed) path:
    const existedBefore = await exists();
    let wrote = false;
    let forcedWrite = false;

    /**
     * Write:
     */
    if (!dryRun && !skipped) {
      if (existedBefore && !force && !changed) {
        // NO-OP: unchanged (skip recorded later in resolver)
      } else {
        await Fs.ensureDir(Path.dirname(absolute()));
        const outBytes = isText ? new TextEncoder().encode(text ?? '') : bytes ?? new Uint8Array();
        await Fs.write(absolute(), outBytes);
        wrote = true;
        forcedWrite = force && existedBefore;
      }
    }

    // Resolve single op:
    const common = {
      dryRun: dryRun || undefined,
      forced: forcedWrite || undefined,
    } satisfies t.FileMapOpCommon;

    // Compute write-kind:
    let kind: t.FileMapOp['kind'];
    if (skipped) {
      kind = 'skip';
    } else if (!existedBefore) {
      kind = 'create';
    } else if (existedBefore && wrote) {
      kind = 'modify';
    } else {
      kind = 'skip'; // (unchanged)
    }

    // Attach renamed meta only on writes (create/modify) and only if path actually changed.
    const renamed =
      prevPath && prevPath !== relative && (kind === 'create' || kind === 'modify')
        ? ({ from: prevPath } as t.FileMapOpRenamed)
        : undefined;

    let resolved: t.FileMapOp;
    if (kind === 'create') {
      resolved = { kind: 'create', path: relative, renamed, ...common };
    } else if (kind === 'modify') {
      resolved = { kind: 'modify', path: relative, renamed, ...common };
    } else {
      resolved = {
        kind: 'skip',
        path: relative,
        reason: skipped ? skippedReason : 'unchanged',
        ...common,
      };
    }

    pushOp(resolved, forcedWrite);
  }

  /**
   * API:
   */
  let _total: t.FileMapWriteResult['total'] | undefined;
  return {
    ops,
    get total() {
      return _total || (_total = wrangle.total(ops));
    },
  };
}

/**
 * Helpers:
 */
const wrangle = {
  total(ops: t.FileMapOp[]): t.FileMapWriteResult['total'] {
    type Total = { [K in t.FileMapOp['kind']]: number };
    return ops.reduce<Total>(
      (acc, o) => {
        acc[o.kind] = (acc[o.kind] ?? 0) + 1;
        return acc;
      },
      { create: 0, modify: 0, skip: 0 },
    );
  },
} as const;
