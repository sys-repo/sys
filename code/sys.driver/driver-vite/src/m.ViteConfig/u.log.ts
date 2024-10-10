import { c, Path, type t } from './common.ts';

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

      const filtered = ws.filter ? c.gray(` (filtered)`) : '';
      const modules = c.brightGreen(c.bold('<ESM Module>'));
      line(c.white(`Workspace ${modules} import-map:${filtered}`));
      line();

      ws.aliases.forEach((alias) => {
        const fullname = alias.find.toString();
        const parts = fullname.split('/');
        const basename = parts.slice(0, 2).join('/');
        const subpath = parts.slice(2).join('/');
        const boldWhite = (s: string) => c.white(c.bold(s));
        const module = c.green(`${boldWhite(basename)}${c.bold('/')}${boldWhite(subpath)}`);
        const path = alias.replacement.slice(ws.dir.length + 1);
        const displayPath = `./${Path.dirname(path)}/${c.white(Path.basename(path))}`;
        line(c.gray(`${c.green('•')} ${c.green('import')} ${module}`));
        line(c.dim(`  ${displayPath}`));
      });
      res = res.trim();
      return options.pad ? `\n${res}\n` : res;
    },
  },
} as const;
