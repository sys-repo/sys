import { type t, Pkg, Str } from './common.ts';

export async function verifyDist(distDir: t.StringDir) {
  const verification = await Pkg.Dist.verify(distDir);
  if (verification.is.valid === true && verification.dist) return verification.dist;

  throw new Error(
    Str.dedent(`
      DenoEntry.serve: invalid dist artifact.

      distDir: ${distDir}
      error: ${verification.error?.message ?? 'Unknown dist verification failure.'}
    `),
  );
}
