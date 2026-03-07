import type { t } from 'jsr:@sys/tools';

import { c } from 'jsr:@sys/cli';
import { env } from 'jsr:@sys/tools/env';

/** Ensure VSCode environment setup (need only run once). */
await env();

/**
 * Plugin extensions (eg. lint tasks).
 */
export const plugins: t.CrdtTool.Hook.Plugin[] = [
  {
    id: 'sample',
    title: `sample ${c.gray('(plugin)')}`,
    async run(e) {
      // 🐷
      console.info('\n', c.cyan('👋 plugin:sample'), c.gray(`| cwd: ${e.cwd}`), '\n');
      return { kind: 'stay' };
    },
  },
];
