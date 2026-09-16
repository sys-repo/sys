import { Fs, Is, Path, type t } from '../common.ts';

/** Apply Vite's existing filesystem policy to the physical target before static fallback. */
export function serverFsGuard(): t.VitePlugin {
  return {
    name: 'sys:fs-root-identity',
    apply: 'serve',
    async configureServer(server) {
      server.middlewares.use(await createMiddleware(server));
    },
  };
}

/**
 * Helpers:
 */
async function createMiddleware(
  server: t.ViteDevServer,
): Promise<t.ViteConnect.NextHandleFunction> {
  const { isFileServingAllowed } = await import('vite');
  return async (req, res, next) => {
    if (!req.url) return next();
    try {
      const file = requestPath(req.url, server.config);
      if (file === undefined) return next();

      const physical = Path.normalize(await Fs.realPath(file));
      if (!isFileServingAllowed(physical, server)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      next();
    } catch (error) {
      if (Is.error(error) && error.name === 'NotFound') return next();
      next(error);
    }
  };
}

function requestPath(rawUrl: string, { root, base }: t.ViteResolvedConfig): string | undefined {
  const url = new URL(rawUrl, 'http://localhost');
  const pathname = base !== '/' && url.pathname.startsWith(base)
    ? url.pathname.slice(base.length - 1)
    : url.pathname;
  const path = decodeURIComponent(pathname);
  if (path.startsWith('/@id/') || path.startsWith('/@vite/')) return;
  return path.startsWith('/@fs/') ? path.slice('/@fs/'.length) : Path.join(root, path);
}
