import type { t } from '../common.ts';
import { Fs, Is, Path } from '../common.ts';

/**
 * Normalize ops so the table renderer can consume either:
 *  - TmplFileOperation[]
 *  - FileMapMaterializeOp[]
 */
export function normalizeOps(ops: readonly any[], baseDir?: t.StringDir): t.TmplFileOperation[] {
  if (!ops?.length) return [];

  if (!looksLikeFileMapOp(ops[0])) {
    return ops as t.TmplFileOperation[]; // ← Already a `TmplFileOperation[]`.
  }

  const base = (baseDir ?? (Fs.cwd('process') as t.StringDir)) as string;

  return (ops as readonly t.FileMapMaterializeOp[]).map((op): t.TmplFileOperation => {
    const rel =
      op.kind === 'rename'
        ? (op.to as string)
        : (op as Extract<t.FileMapMaterializeOp, { path?: string }>).path ?? '';

    const abs = rel ? (Path.join(base, rel) as t.StringPath) : (base as unknown as t.StringPath);
    const targetFile = Fs.toFile(abs);

    const out: any = { file: { target: targetFile } };

    switch (op.kind) {
      case 'write':
        out.created = true;
        break;
      case 'modify':
        out.updated = true;
        break;
      case 'rename': {
        const from = op.from;
        const to = rel || op.to || '';
        out.renamed = from ? { from, to } : { to };
        break;
      }
      case 'skip':
        out.excluded = true;
        break;
    }

    return out as t.TmplFileOperation;
  });
}

/**
 * Helpers:
 */
const looksLikeFileMapOp = (o: any): o is t.FileMapMaterializeOp => {
  return (
    Is.record(o) &&
    Is.string(o.kind) &&
    ('path' in o || (o.kind === 'rename' && 'from' in o && 'to' in o))
  );
};
