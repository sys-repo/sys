import { type t, Fs, HttpServer, Is } from './common.ts';
import { fallback } from './u.fallback.ts';
import { loadTarget } from './u.path.ts';

export const serve: t.DenoEntry.Serve = async (options) => {
  const target = await loadTarget(options);
  if (!target.hasEntry) return createFallbackApp(target.dist.absolute, target.pkg, target.hash);
  return await loadEntryApp(target.entry.absolute, target.target.relative);
};

/**
 * Helpers:
 */

async function loadEntryApp(entryPath: t.StringPath, targetDir: t.StringRelativeDir) {
  const entry = await import(Fs.Path.toFileUrl(entryPath).href);
  if (!Is.func(entry.main)) {
    throw new Error(`DenoEntry.serve: missing exported 'main' in ${entryPath}`);
  }
  return await entry.main({ targetDir } satisfies t.DenoEntry.EntryContext);
}

function createFallbackApp(distDir: t.StringDir, pkg: t.Pkg, hash: t.StringHash) {
  const app = HttpServer.create({ pkg, hash, static: false });
  const server = HttpServer.static({ root: distDir, onNotFound: fallback(distDir) });
  app.use('*', server);
  return { fetch: app.fetch } satisfies t.DenoEntry.EntryResult;
}
