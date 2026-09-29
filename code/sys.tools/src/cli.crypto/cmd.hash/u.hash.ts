import { Err, Fs, Is, Pkg, pkg, type t } from '../common.ts';
import { HashJobSchema } from './u.hash.schema.ts';

export const HashJob = {
  toRunParams(
    job: t.HashJob,
    opts: { onHashProgress?: (e: t.HashProgressEvent) => void | Promise<void> } = {},
  ): t.HashRunParams {
    return {
      targetDir: Fs.resolve(job.dir),
      saveDist: job.saveDist ?? false,
      onHashProgress: opts.onHashProgress,
    };
  },
} as const;

export async function runHashJob(
  value: unknown,
  opts: { onHashProgress?: (e: t.HashProgressEvent) => void | Promise<void> } = {},
): Promise<t.HashRunResult> {
  const checked = HashJobSchema.validate(value);
  if (!checked.ok) throw Err.std(`Invalid hash job (${checked.errors.length} schema errors)`);

  const params = HashJob.toRunParams(checked.value, opts);
  const res = await Pkg.Dist.compute({
    dir: params.targetDir,
    save: params.saveDist,
    builder: pkg,
    onHashProgress: params.onHashProgress,
  });
  if (res.kind !== 'computed') throw res.error;
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
    pin: res.pin,
  };
}
