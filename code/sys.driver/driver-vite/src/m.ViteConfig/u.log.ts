import { c, type t, Path } from './common.ts';

/**
 * Logging helpers.
 */
export const Log = {
  /**
   * Workspace
   */
  Workspace: {
    toString(ws: t.ViteDenoWorkspace, options: { pad?: boolean } = {}) {
      let res = '';
      const line = (...parts: string[]) => (res += `\n${parts.join(' ')}`);

      const filtered = ws.filter ? c.gray(` (filtered)`) : '';
      const modules = c.brightGreen(c.bold('<Modules>'));
      line(c.white(`Workspace ${modules} import map:${filtered}`));
      line();

      ws.aliases.forEach((alias) => {
        const mod = c.green(alias.find.toString());
        const path = alias.replacement;
        const displayPath = `${Path.dirname(path)}/${c.white(Path.basename(path))}`;
        line(c.gray(`${c.green('•')} ${c.white('import')} ${mod}`));
        line(c.dim(`  ${displayPath}`));
      });
      res = res.trim();
      return options.pad ? `\n${res}\n` : res;
    },
  },
} as const;
