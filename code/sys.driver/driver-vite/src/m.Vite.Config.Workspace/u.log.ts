import { type t, c, Cli, Path } from './common.ts';

/**
 * Workspace logging helpers.
 */
export const Log = {
  toString(ws: t.ViteDenoWorkspace, options: { pad?: boolean } = {}) {
    let res = '';
    const line = (...parts: string[]) => (res += `\n${parts.join(' ')}`);

    const filtered = ws.filter ? c.dim(` (filtered)`) : '';
    line(c.gray(c.bold(`Docs`)));
    const modules = c.brightGreen(c.bold('<ESM Module>'));
    line(c.white(`  Workspace ${modules} import-map:`), filtered);
    line();

    const table = Cli.table([c.dim('  Export:'), '', c.dim(' Maps to:')]);

    let _lastScope = '';
    ws.aliases.forEach((alias) => {
      const fullname = alias.find.toString();

      const parts = fullname.split('/');
      const scope = parts.slice(0, 2).join('/');
      const isFirstRenderOfScope = scope !== _lastScope;
      _lastScope = scope;

      const path = alias.replacement.slice(ws.dir.length + 1);
      const displayPath = `./${Path.dirname(path)}/${c.white(Path.basename(path))}`;

      const module = Cli.Fmt.path(fullname, (e) => {
        if (e.is.slash) {
          if (e.index >= 3) {
            e.change(c.green(e.part));
          } else {
            const next = isFirstRenderOfScope ? c.gray(e.part) : c.dim(e.part);
            e.change(next);
          }
        }
        if (isFirstRenderOfScope && !e.is.slash) {
          if (e.index === 0 || e.index === 2) {
            e.change(c.white(e.part));
          } else {
            e.change(c.gray(e.part));
          }
        } else {
          if (e.index > 2) {
            e.change(c.gray(e.part));
          } else {
            const text = e.index === 0 ? c.dim(e.part) : c.gray(e.part);
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
} as const;
