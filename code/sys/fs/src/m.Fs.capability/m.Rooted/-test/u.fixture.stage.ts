import type { t } from './u.fixture.ts';

const bytes = (value: string) => new TextEncoder().encode(value);

/** Publish the minimal manifest fixture used by stage-promotion tests. */
export async function writeStageManifest(
  stage: t.FsRooted.Stage,
  value: string,
): Promise<void> {
  const admission = await stage.files.Target.admit([{ kind: 'file', path: 'dist.json' }]);
  await stage.files.File.publish(admission.targets[0], bytes(value));
}

/** Publish the nested Dist-shaped fixture used by owned-tree tests. */
export async function writeStageDist(stage: t.FsRooted.Stage): Promise<void> {
  const files = await stage.files.Target.admit([
    { kind: 'file', path: 'dist.json' },
    { kind: 'file', path: 'pkg/main.js' },
  ]);
  await stage.files.File.publish(files.targets[0], bytes('manifest'));
  await stage.files.File.publish(files.targets[1], bytes('export default 123;'));
}
