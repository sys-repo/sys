import type { t } from '../common.ts';

/**
 * Setup routes for deploying and managing sub-hosting instances.
 */
export function routes(ctx: t.RouteContext) {
  const { app } = ctx;

  /**
   * GET: root.
   */
  app.get('/', (c) => {
    const { name, version } = ctx.pkg;
    const pkg = { name, version };
    const res: t.RootResponse = { pkg };
    return c.json(res);
  });
}
