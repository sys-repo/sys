import { type t, Err, Fs, Is, Pkg } from '../common.ts';
import { HashJobSchema } from './u.hash.schema.ts';
import type * as h from './t.ts';

export const HashJob = {
  toRunParams(job: h.HashJob): h.HashRunParams {
    return {
      targetDir: Fs.resolve(job.dir),
      saveDist: job.saveDist ?? false,
    };
  },
} as const;

export async function runHashJob(value: unknown): Promise<h.HashRunResult> {
  const checked = HashJobSchema.validate(value);
  if (!checked.ok) throw Err.std(`Invalid hash job (${checked.errors.length} schema errors)`);

  const params = HashJob.toRunParams(checked.value);
  const res = await Pkg.Dist.compute({ dir: params.targetDir, save: params.saveDist });
  if (res.error) throw res.error;
  if (!res.exists) throw Err.std(`Path does not exist: ${params.targetDir}`);
  if (!Pkg.Is.dist(res.dist)) throw Err.std(`Computed dist is not canonical: ${params.targetDir}`);

  const dist = res.dist;
  const fileCount = Object.keys(dist.hash.parts).length;
  const bytesTotal = dist.build.size.total;
  const computedAt = dist.build.time;
  const digest = dist.hash.digest;
  if (!Is.str(digest)) throw Err.std(`Computed digest is invalid: ${params.targetDir}`);

  return {
    targetDir: params.targetDir,
    digest,
    fileCount,
    bytesTotal,
    computedAt,
    dist,
  };
}
