import type { t } from './common/mod.ts';

export const Auth: t.AuthLib = {
  /**
   * Security middleware.
   */
  middleware(ctx: t.RouteContext, options = {}) {
    const { enabled = true, logger } = options;
    const _auth = ctx.auth;

    const allowedPaths = ['/'];
    const isAllowedPath = (path: string) => allowedPaths.find((v) => path.startsWith(v));

    return async (c, next) => {
      const log = (status: t.AuthLogEntry['status']) => {
        if (!logger) return;
        logger({ status, path: c.req.path });
      };

      if (!enabled) {
        log('Skipped:Disabled');
        return await next(); // NB: auth disabled (eg. running within CI).
      }

      if (isAllowedPath(c.req.path)) {
        log('Skipped:Allowed');
        return next(); // NB: Path is not included within auth requirements.
      }

      /**
       * TODO 🐷
       * - to Privy auth checks.
       */
      console.log('⚡️💦🐷🌳🦄 🍌🧨🌼✨🧫 🐚👋🧠⚠️ 💥👁️💡• ↑↓←→');
      console.log('c.url', c.req.url);
      // const auth = await ctx.auth.verify(c.req.raw);
      // if (!auth.verified) return c.json({ error: 'Unauthorized' }, 401);

      await next();
    };
  },
};
