import { Pkg, Str, type t } from './common.ts';

export async function checkSelfReportedDist(distDir: t.StringDir) {
  // Local consistency only: these limits and successful reads do not supply an independent pin.
  const checked = await Pkg.Dist.Local.verify({
    dir: distDir,
    limits: {
      manifestBytes: 4 * 1024 * 1024,
      entries: 16_384,
      fileBytes: 64 * 1024 * 1024,
      totalBytes: 512 * 1024 * 1024,
    },
  });
  if (checked.kind === 'verified') return checked.evidence.content;

  throw new Error(
    Str.dedent(`
      DenoEntry.serve: local Dist verification refused.

      distDir: ${distDir}
      UNPINNED local verification refusal: ${checked.kind}
    `),
  );
}
