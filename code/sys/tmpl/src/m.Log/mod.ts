import { type t, c, Cli } from './common.ts';

export const Log: t.TmplLogLib = {
  ops(ops) {
    return {
      get ops() {
        return ops;
      },
      table(options = {}) {
        const table = Cli.table([]);
        const indent = options.indent ? ' '.repeat(options.indent) : '';
        ops.forEach((op) => {
          const path = wrangle.path(op);
          const action = wrangle.action(op);
          const note = wrangle.note(op);
          table.push([`${indent}${action}`, path, note]);
        });
        return table;
      },
    };
  },
};

/**
 * Helpers
 */
const wrangle = {
  path(op: t.TmplFileOperation) {
    const file = op.file.target;
    const text = c.gray(`${file.dir}/${c.white(file.name)}`);
    return op.excluded ? c.dim(text) : text;
  },
  action(op: t.TmplFileOperation) {
    if (op.excluded) return c.gray(c.dim(''));
    if (op.created) return c.green('Created');
    if (op.updated) return c.yellow('Updated');
    return c.gray('Unchanged');
  },
  note(op: t.TmplFileOperation) {
    if (op.excluded) {
      const reason = typeof op.excluded === 'object' ? op.excluded.reason : '';
      const text = reason ? `← excluded: ${reason}` : '← excluded';
      return c.gray(text);
    }
    return '';
  },
} as const;
