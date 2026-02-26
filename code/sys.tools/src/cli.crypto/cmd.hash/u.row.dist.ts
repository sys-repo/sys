import { type t, Delete, Fs, Pkg } from '../common.ts';

export const HashRowDist = {
  async readBefore(dir: t.StringDir): Promise<t.HashDistRowBefore> {
    const path = Fs.Path.join(dir, 'dist.json');
    const loaded = await Pkg.Dist.load(dir);
    const kind = wrangle.kind(loaded.kind);
    const digest = kind === 'canonical' ? loaded.dist?.hash?.digest : undefined;
    return { path, exists: loaded.exists, kind, digest };
  },

  afterRun(args: {
    before: t.HashDistRowBefore;
    saveDist: boolean;
    digest: t.StringHash;
  }): t.HashDistRow | undefined {
    const { before, saveDist, digest } = args;
    if (!before.exists && !saveDist) return undefined;

    let status: t.HashDistRowStatus | undefined;
    if (saveDist) {
      if (!before.exists) status = 'created';
      else if (before.kind !== 'canonical') status = 'changed';
      else if (before.digest !== digest) status = 'changed';
    } else {
      if (before.kind !== 'canonical') status = before.exists ? 'invalid' : undefined;
      else if (before.digest !== digest) status = 'differs';
    }

    return Delete.undefined<t.HashDistRow>({ path: before.path, status });
  },
} as const;

const wrangle = {
  kind(kind: string): t.HashDistRowBefore['kind'] {
    if (kind === 'canonical') return 'canonical';
    if (kind === 'legacy') return 'legacy';
    if (kind === 'missing') return 'missing';
    return 'invalid';
  },
} as const;
