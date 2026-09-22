import type { t } from './common.ts';
import { createHandler } from './u.handler.ts';
import { snapshot } from './u.input.ts';

/**
 * Create a GET/HEAD handler for explicitly authorized R2 object reads.
 */
export function create(options: t.R2.ReadRoute.CreateOptions): t.R2.ReadRoute.Handler {
  return createHandler(snapshot(options));
}
