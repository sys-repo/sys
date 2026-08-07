import { DistServer, type t } from './common.ts';

type ServeDependencies = {
  readonly Local: Pick<t.DistServer.Local.Lib, 'serve'>;
};

const PREVIEW_LIMITS = Object.freeze(
  {
    manifestBytes: 16 * 1024 * 1024,
    entries: 8_193,
    fileBytes: 128 * 1024 * 1024,
    totalBytes: 1024 * 1024 * 1024,
  } satisfies t.DistServer.Local.Args['limits'],
);

/** Serve a verified production bundle from entry command args. */
export async function serve(args: t.ViteEntry.Args.Serve) {
  return await serveWith(args, DistServer);
}

/** Internal dependency seam for deterministic entry orchestration tests. */
export async function serveWith(
  args: t.ViteEntry.Args.Serve,
  deps: ServeDependencies,
) {
  if (args.cmd !== 'serve') return;

  const { port = 8080, dir = 'dist', silent = false } = args;
  await deps.Local.serve({
    dir: dir as t.StringDir,
    limits: PREVIEW_LIMITS,
    port,
    silent,
  });
}
