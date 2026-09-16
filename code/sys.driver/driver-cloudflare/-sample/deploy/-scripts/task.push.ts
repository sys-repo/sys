import { Deploy, type DeployTool } from '@sys/tools/deploy';
import { Yaml } from '@sys/yaml';
import { Arr, Fs, Is, Obj, Pkg, ROOT } from './common.ts';
import { readData } from '../src/u.data.ts';
import { artifactFrom, configFrom, DIST_LIMITS } from '../src/u.selection.ts';

/** Push the existing selected build. Never rebuild, stage, or resolve secrets into a file. */
export async function pushSample(root = ROOT, publish: DeployTool.Lib['push'] = Deploy.push) {
  const data = (name: string) => readData(Fs.Path.toFileUrl(Fs.join(root, name)));
  const config = configFrom(await data('config.json'));
  const artifact = artifactFrom(await data('artifact.json'));
  const verified = await Pkg.Dist.Pinned.verify({
    dir: Fs.join(root, 'dist'),
    integrity: artifact.integrity,
    limits: DIST_LIMITS,
  });
  if (verified.kind !== 'verified') throw new Error(`Sample Dist refused: ${verified.kind}.`);
  const files = [...Obj.keys(verified.evidence.dist.hash.parts).map(String), 'dist.json'].sort();
  if (!Arr.equal(files, [...artifact.files].sort())) {
    throw new Error('Sample artifact filenames do not match the verified Dist.');
  }

  const endpoint = {
    provider: {
      kind: 'r2',
      accountId: config.accountId,
      bucket: config.bucket,
      prefix: config.prefix,
      credentials: {
        accessKeyId: `\${env:${config.credentials.accessKeyId}}`,
        secretAccessKey: `\${env:${config.credentials.secretAccessKey}}`,
      },
    },
    staging: { dir: './dist' },
    mappings: [],
  } satisfies DeployTool.Config.EndpointYaml.Doc;
  const path = Fs.join(root, '.tmp', 'push.yaml');
  const yaml = Yaml.stringify(endpoint);
  if (yaml.error) throw new Error('Sample upload configuration could not be serialized.');
  await Fs.write(path, yaml.data, { throw: true });

  try {
    return await publish({ cwd: root, config: path });
  } catch (error) {
    throw pushFailure(error);
  }
}

if (import.meta.main) {
  const result = await pushSample();
  const files = result.publish?.files ?? [];
  const written = files.filter((file) => file.status === 'written').length;
  const skipped = files.filter((file) => file.status === 'skipped').length;
  console.info(
    `R2 push: ${written} written, ${skipped} skipped, ${result.prune?.files.length ?? 0} removed.`,
  );
}

/** Keep permission denials visible through Deploy's wrappers, but redact provider diagnostics. */
function pushFailure(error: unknown): Error {
  const pending = [error];
  const seen = new Set<unknown>();
  while (pending.length) {
    const value = pending.pop();
    if (seen.has(value) || (!Is.error(value) && !Is.record(value))) continue;
    seen.add(value);
    if (
      (value.name === 'NotCapable' || value.name === 'PermissionDenied') && Is.str(value.message)
    ) {
      if (Is.error(value)) return value;
      const denial = new Error(value.message);
      denial.name = value.name;
      return denial;
    }
    if ('cause' in value) pending.push(value.cause);
    if ('error' in value) pending.push(value.error);
  }
  return new Error('Sample R2 push failed. No automatic retry or cleanup was performed.');
}
