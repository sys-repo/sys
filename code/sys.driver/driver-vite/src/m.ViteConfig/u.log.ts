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

      const table = Cli.table(['Module export:', '', 'Maps to:']);

      let _lastScope = '';
      ws.aliases.forEach((alias) => {
        const fullname = alias.find.toString();

        const parts = fullname.split('/');
        const scope = parts.slice(0, 2).join('/');
        const subpath = parts.slice(2).join('/');
        const boldWhite = (s: string) => c.white(c.bold(s));

        const isFirstRenderOfScope = scope !== _lastScope;
        _lastScope = scope;

        const path = alias.replacement.slice(ws.dir.length + 1);
        const displayPath = `./${Path.dirname(path)}/${c.white(Path.basename(path))}`;

        const scopeCol = isFirstRenderOfScope ? c.white : c.gray;
        const module = c.white(`${scopeCol(scope)}${c.green('/')}${c.white(subpath)}`);

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
