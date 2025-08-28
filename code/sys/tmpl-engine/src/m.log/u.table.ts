import { type t, c, Cli, Path } from './common.ts';
import { normalizeOps } from './u.normalize.ts';

export const table: t.TmplLogLib['table'] = (ops, options = {}) => {
  const table = Cli.table([]);
  const indent = options.indent ? ' '.repeat(options.indent) : '';

  if (ops.length === 0) {
    return c.gray(c.italic(`${indent}No items to display`));
  }

  // Default to trimming with baseDir when trimPathLeft isn't provided.
  const effectiveTrimLeft = options.trimPathLeft ?? options.baseDir;

  // Normalize incoming ops (supports FileMapMaterializeOp[] or TmplFileOperation[]).
  const normalized = normalizeOps(ops, options.baseDir).filter((op) =>
    options.hideExcluded ? !op.excluded : true,
  );

  // Dedupe by absolute target path; keep the strongest signal:
  // |→ created (3) → updated (2) → unchanged (1).
  // NB: Excluded is handled by filter above.
  const rank = (op: t.TmplFileOperation): number => {
    if (op.excluded) return -1;
    if (op.created) return 3;
    if (op.updated) return 2;
    return 1; // unchanged (we deliberately ignore any "renamed" hints)
  };

  const byPath = new Map<string, t.TmplFileOperation>();
  for (const op of normalized) {
    const abs = op.file?.target?.absolute;
    if (!abs) continue;
    const prev = byPath.get(abs);
    if (!prev || rank(op) > rank(prev)) byPath.set(abs, op);
  }
  const deduped = Array.from(byPath.values());

  deduped.forEach((op) => {
    const path = wrangle.path(op, effectiveTrimLeft);
    const action = wrangle.action(op);
    const note = wrangle.note(op, options);
    table.push([`${indent}${action}`, path, note]);
  });

  return table.toString().replace(/^\s*\n/, '');
};

/**
 * Helpers:
 */
const wrangle = {
  path(op: t.TmplFileOperation, trimLeft?: string) {
    const abs = op.file?.target?.absolute;
    if (!abs) return '';
    const left = trimLeft ? Path.resolve(trimLeft) : undefined;
    const shown = left ? Path.relative(left, abs) : abs;
    return Cli.Format.path(shown, (e) => {
      if (e.is.basename) e.change(c.white(e.text));
      else e.change(c.gray(e.text));
    });
  },

  action(op: t.TmplFileOperation) {
    if (op.excluded) return c.gray(c.dim(' n/a'));
    if (op.created) return c.green('Created');
    if (op.updated) return c.yellow('Updated');
    return c.gray('Unchanged'); // no rename slot, no inference
  },

  note(op: t.TmplFileOperation, options: t.TmplLogTableOptions) {
    let text = '';
    const append = (value: string) => {
      if (text) text += ' | ';
      text += value;
      return text;
    };
    if (op.excluded) {
      const base = 'skipped';
      const reason = typeof op.excluded === 'object' ? op.excluded.reason : '';
      append(reason ? `${base}: ${reason}` : base);
    }
    if (op.forced && !op.excluded) append(c.yellow('forced'));

    // Prefer explicit caller intent; fall back to heuristic:
    const showDryRun = options.dryRun ?? (!op.written && (op.created || op.updated));
    if (showDryRun) append(c.cyan('dry-run'));

    if (typeof options.note === 'function') {
      const note = options.note(op);
      if (note) append(note);
    }
    return text ? c.gray(`${c.white('←')} ${text}`) : '';
  },
} as const;
