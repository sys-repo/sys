import { Pkg, Str, type t } from './common.ts';

export async function checkSelfReportedDist(distDir: t.StringDir) {
  const checked = await Pkg.Dist.checkSelfReported(distDir);
  if (checked.is.valid === true && checked.dist) return checked.dist;

  throw new Error(
    Str.dedent(`
      DenoEntry.serve: inconsistent self-reported dist artifact.

      distDir: ${distDir}
      error: ${checked.error?.message ?? 'Unknown dist consistency failure.'}
    `),
  );
}
