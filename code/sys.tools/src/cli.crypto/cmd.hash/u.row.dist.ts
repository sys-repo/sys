import { type t, Delete, Err, Fs, Pkg } from '../common.ts';

export const HashRowDist = {
  async readBefore(dir: t.StringDir): Promise<t.HashDistRowBefore> {
    const path = Fs.Path.join(dir, 'dist.json');
    const exists = await Fs.exists(path);
    if (!exists) return { path, exists: false, kind: 'missing' };

    const stat = await wrangle.requireStat(path);
    const loaded = await Pkg.Dist.load(dir);
    const kind = wrangle.kind(loaded.kind);
    const digest = kind === 'canonical' ? loaded.dist?.hash?.digest : undefined;
    return { path, exists: true, kind, sizeBytes: stat.size, digest };
  },

  async afterRun(args: {
    before: t.HashDistRowBefore;
    saveDist: boolean;
    digest: t.StringHash;
  }): Promise<t.HashDistRow | undefined> {
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

    const sizeBytes = await wrangle.sizeBytes(before, saveDist);
    return Delete.undefined<t.HashDistRow>({ path: before.path, sizeBytes, status });
  },
} as const;

const wrangle = {
  async sizeBytes(before: t.HashDistRowBefore, saveDist: boolean): Promise<t.NumberBytes | undefined> {
    if (!before.exists && !saveDist) return undefined;
    if (!saveDist) return before.sizeBytes;
    const stat = await wrangle.requireStat(before.path);
    return stat.size;
  },

  async requireStat(path: t.StringPath) {
    const stat = await Fs.stat(path);
    if (!stat) throw Err.std(`Expected file metadata for ${path}`);
    return stat;
  },

  kind(kind: string): t.HashDistRowBefore['kind'] {
    if (kind === 'canonical') return 'canonical';
    if (kind === 'legacy') return 'legacy';
    if (kind === 'missing') return 'missing';
    return 'invalid';
  },
} as const;
