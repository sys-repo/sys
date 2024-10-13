import { c, Cli, Path, type t } from './common.ts';

/**
 * Logging helpers.
 */
export const Log = {
  /**
   * Workspace.
   */
  Workspace: {
    toString(ws: t.ViteDenoWorkspace, options: { pad?: boolean } = {}) {
      let res = '';
      const line = (...parts: string[]) => (res += `\n${parts.join(' ')}`);

      const filtered = ws.filter ? c.dim(` (filtered)`) : '';
      const modules = c.brightGreen(c.bold('<ESM Module>'));
      line(c.white(`Workspace ${modules} import-map:`), filtered);
      line();

      const table = Cli.table([c.dim('  Exports:'), '', c.dim(' Maps to:')]);

      let _lastScope = '';
      ws.aliases.forEach((alias) => {
        const fullname = alias.find.toString();

        const parts = fullname.split('/');
        const scope = parts.slice(0, 2).join('/');
        const isFirstRenderOfScope = scope !== _lastScope;
        _lastScope = scope;

        const path = alias.replacement.slice(ws.dir.length + 1);
        const displayPath = `./${Path.dirname(path)}/${c.white(Path.basename(path))}`;

        const module = Cli.Format.path(fullname, (e) => {
          if (e.is.slash) {
            if (e.index >= 3) {
              e.change(c.green(e.text));
            } else {
              const next = isFirstRenderOfScope ? c.gray(e.text) : c.dim(e.text);
              e.change(next);
            }
          }
          if (isFirstRenderOfScope && !e.is.slash) {
            if (e.index === 0 || e.index === 2) {
              e.change(c.white(e.text));
            } else {
              e.change(c.gray(e.text));
            }
          } else {
            if (e.index > 2) {
              e.change(c.gray(e.text));
            } else {
              const text = e.index === 0 ? c.dim(e.text) : c.gray(e.text);
              e.change(text);
            }
          }
        });

        const left = c.gray(`${c.green('•')} ${c.green('import')} ${module}`);
        const right = c.gray(`${displayPath}`);
        table.push([left, c.green('→'), right]);
      });
      line(table.toString());
      res = res.trim();
      return options.pad ? `\n${res}\n` : res;
    },
  },
} as const;
