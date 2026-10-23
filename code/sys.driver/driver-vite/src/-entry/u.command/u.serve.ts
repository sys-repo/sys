import { c } from '@sys/cli/fmt';
import { DistServer } from '@sys/server/dist/server';
import { Str } from '@sys/std/str';
import type { t } from '../common.ts';
import { resolvePkgSubpath } from './u.pkgSubpath.ts';

type ServeDependencies = {
  Local: { readonly serve: (args: t.DistServer.Local.ServeArgs) => Promise<void> };
};

type DispatchEffects = {
  write(text: string): void;
  exitCode(code: number): void;
};

const PREVIEW_LIMITS = Object.freeze(
  {
    manifestBytes: 16 * 1024 * 1024,
    entries: 8_193,
    fileBytes: 128 * 1024 * 1024,
    totalBytes: 1024 * 1024 * 1024,
  } satisfies t.DistServer.Local.Args['limits'],
);

const DISPATCH_EFFECTS: DispatchEffects = {
  write: (text) => console.error(text),
  exitCode: (code) => void (Deno.exitCode = code),
};

/**
 * Serve a verified production bundle from entry command args.
 */
export async function serve(args: t.ViteEntry.Args.Serve) {
  return await serveWith(args, DistServer);
}

/** Internal dependency seam for deterministic entry orchestration tests. */
export async function serveWith(
  args: t.ViteEntry.Args.Serve,
  deps: ServeDependencies,
) {
  if (args.cmd !== 'serve') return;

  const pkgSubpath = resolvePkgSubpath(args);
  const { port = 8080, dir = 'dist', silent = false } = args;
  await deps.Local.serve({
    dir,
    limits: PREVIEW_LIMITS,
    port,
    silent,
    ...(pkgSubpath === undefined ? {} : { pkgSubpath }),
  });
}

/** Run the selected verified-Dist serve command. */
export async function dispatch(args: t.ViteEntry.Args.Serve): Promise<void> {
  await dispatchWith(args, serve);
}

/** Internal CLI orchestration seam; the programmatic serve boundary still rejects. */
export async function dispatchWith(
  args: t.ViteEntry.Args.Serve,
  run: (args: t.ViteEntry.Args.Serve) => Promise<void>,
  effects: DispatchEffects = DISPATCH_EFFECTS,
): Promise<void> {
  try {
    // Serving rejection follows its owned cleanup; report only after that settles.
    await run(args);
  } catch (cause) {
    if (!DistServer.Error.is(cause) || cause.reason !== 'address-in-use') throw cause;
    const { port = 8080 } = args;
    const text = Str.builder()
      .line(c.red('Cannot serve'))
      .line('')
      .line(`  ${c.white(`127.0.0.1:${port} is already in use.`)}`)
      .line(`  ${c.gray('Stop the existing server or choose another port.')}`);
    effects.write(text.toText({ trailingNewline: true }));
    effects.exitCode(1);
  }
}
