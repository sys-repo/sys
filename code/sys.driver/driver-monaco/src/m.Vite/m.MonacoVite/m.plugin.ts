import { Fs, Is, MediaType, type t } from './common.ts';
import { MOUNT } from './u.constants.ts';
import type { Source, SourceLocation } from './t.ts';
import { emitAssets } from './u.emit.ts';
import { fail } from './u.error.ts';
import { resolveSource, resolveSourceLocation, resolveSourcePath } from './u.source.ts';
import { readRegularFile } from './u.tree.ts';
import { urlRoot } from './u.url.ts';

/** Create Monaco's self-hosted runtime asset integration. */
export const plugin: t.MonacoVite.Lib['plugin'] = () => {
  let sourceLocation: Promise<SourceLocation> | undefined;
  let source: Promise<Source> | undefined;
  const getSourceLocation = () => sourceLocation ??= resolveSourceLocation();
  const getSource = () => source ??= getSourceLocation().then(resolveSource);
  const emissions = new Map<string, Promise<void>>();

  return {
    name: '@sys/driver-monaco:assets',

    configureServer(server) {
      const root = urlRoot(server.config.base, MOUNT);
      server.middlewares.use(async (request, response, next) => {
        try {
          const requestPath = new URL(request.url ?? '/', 'http://localhost').pathname;
          if (!requestPath.startsWith(root)) return next();

          let relative: string;
          try {
            relative = decodeURIComponent(requestPath.slice(root.length));
          } catch {
            return next();
          }
          const resolved = await getSourceLocation();
          const path = await resolveSourcePath(resolved, relative);
          if (!path) return next();

          const data = await readRegularFile(path);
          const media = MediaType.fromPath(path) ?? MediaType.Fallback.binary;
          const contentType = MediaType.toContentType(media) ?? media;
          response.statusCode = 200;
          response.setHeader('cache-control', 'no-store');
          response.setHeader('content-type', contentType);
          response.setHeader('x-content-type-options', 'nosniff');
          response.end(data);
        } catch (error) {
          next(error);
        }
      });
    },

    async writeBundle(output) {
      // Vite.Config.app installs application plugins into worker builds too. The runtime tree is
      // one client-release artifact, never worker or server-environment output.
      if (this.environment.config.isWorker || this.environment.config.consumer !== 'client') return;

      const outDir = output.dir;
      if (!Is.string(outDir) || !outDir.trim()) {
        return fail('Vite did not provide an output directory.');
      }

      const target = Fs.resolve(outDir, MOUNT);
      let emission = emissions.get(target);
      if (!emission) {
        emission = emitAssets(getSource, target);
        emissions.set(target, emission);
      }
      await emission;
    },
  };
};
