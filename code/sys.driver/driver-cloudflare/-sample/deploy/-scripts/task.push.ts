import { Cli } from '@sys/cli';
import { Deploy } from '@sys/tools/deploy';
import { Yaml } from '@sys/yaml';
import { readInputs } from '../src/m.app/u.data.ts';
import { c, Fs, Is, ROOT, type t } from './common.ts';
import { selectBuild } from './u.selection.ts';

/**
 * Push the existing selected build. Never rebuild or resolve secrets into a file.
 */
export async function pushSample(
  root = ROOT,
  publish: (args: t.DeployTool.PushFileArgs) => Promise<t.DeployTool.PushResult> = Deploy.push,
) {
  const { config, pin } = await readInputs(root);
  const selected = await selectBuild(pin, root);
  if (selected.kind !== 'verified') throw new Error(`Sample Dist refused: ${selected.kind}.`);

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
  } satisfies t.DeployTool.Config.EndpointYaml.Doc;
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

/**
 * Main
 */
if (import.meta.main) {
  const result = await Cli.Spinner.with(
    Cli.Fmt.spinnerText('pushing to R2…', false),
    () => pushSample(),
  );
  const files = result.publish?.files ?? [];
  const written = files.filter((file) => file.status === 'written').length;
  const skipped = files.filter((file) => file.status === 'skipped').length;
  const removed = result.prune?.files.length ?? 0;
  const prefix = c.cyan('R2 push:');
  console.info(`${prefix} ${written} written, ${skipped} skipped, ${removed} removed.`);
}
