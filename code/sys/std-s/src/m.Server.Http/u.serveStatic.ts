import { serveStatic as honoStatic } from 'hono/deno';
import type { t } from './common.ts';

type Input = Parameters<t.HttpServeStatic>[0];

export const serveStatic: t.HttpServeStatic = (input: Input) => {
  const options = wrangle.options(input);
  return honoStatic(options);
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
