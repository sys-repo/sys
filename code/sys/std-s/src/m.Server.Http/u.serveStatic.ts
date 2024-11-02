import { serveStatic as base } from '@hono/hono/deno';
import type { t } from './common.ts';

type Input = Parameters<t.HttpServeStatic>[0];

export const serveStatic: t.HttpServeStatic = (input: Input) => {
  const options = wrangle.options(input);
  return base(options);
};

/**
 * Helpers
 */
const wrangle = {
  options(input: Input) {
    if (typeof input === 'string') return { root: input };
    return input;
  },
} as const;
