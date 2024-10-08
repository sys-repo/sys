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
      line(c.white(`Workspace ${c.green('<Modules>')}:${filtered}`));
      line();

      ws.aliases.forEach((alias) => {
        const mod = c.green(alias.find.toString());
        const path = alias.replacement;
        const displayPath = `${Path.dirname(path)}/${c.white(Path.basename(path))}`;
        line(c.gray(` ${c.green('•')} ${c.gray('import')} ${mod}`));
        line(c.gray(`   ${'→'} ${displayPath}`));
      });
      res = res.trim();
      return options.pad ? `\n${res}\n` : res;
    },
  },
} as const;
