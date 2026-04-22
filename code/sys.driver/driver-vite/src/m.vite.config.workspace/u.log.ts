import { type t, Path } from './common.ts';

/**
 * Workspace logging helpers.
 */
export const Log: {
  toString(ws: t.ViteDenoWorkspace, options?: { pad?: boolean }): string;
} = {
  toString(ws: t.ViteDenoWorkspace, options: { pad?: boolean } = {}) {
    const lines: string[] = [];
    const push = (...parts: string[]) => lines.push(parts.join(''));

    push('Docs');
    push(`  Workspace <ESM Module> import-map:${ws.filter ? ' (filtered)' : ''}`);
    push('');
    push('  Export: → Maps to:');

    for (const alias of ws.aliases) {
      const fullname = alias.find.toString();
      const path = alias.replacement.slice(ws.dir.length + 1);
      const displayPath = `./${Path.dirname(path)}/${Path.basename(path)}`;
      push(`  • import ${fullname} → ${displayPath}`);
    }

    const res = lines.join('\n').trim();
    return options.pad ? `\n${res}\n` : res;
  },
};
