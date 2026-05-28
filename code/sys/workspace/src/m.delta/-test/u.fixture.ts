import { type t } from '../../-test.ts';

export const Fixture = {
  collect(args: {
    readonly orderedPaths: readonly t.StringPath[];
    readonly edges?: readonly t.WorkspaceBump.PackageEdge[];
    readonly candidates: readonly t.WorkspaceBump.Candidate[];
  }): t.WorkspaceBump.CollectResult {
    return {
      cwd: '/tmp/workspace',
      release: 'patch',
      orderedPaths: args.orderedPaths,
      edges: args.edges ?? [],
      candidates: args.candidates,
    };
  },

  candidate(pkgPath: t.StringPath, name: string): t.WorkspaceBump.Candidate {
    return {
      pkgPath,
      denoFilePath: `${pkgPath}/deno.json`,
      name,
      version: {
        current: { major: 1, minor: 0, patch: 0, prerelease: [], build: [] },
        next: { major: 1, minor: 0, patch: 1, prerelease: [], build: [] },
      },
    };
  },
} as const;
