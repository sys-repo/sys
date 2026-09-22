import { Cli } from '@sys/cli';
import { Deploy } from '@sys/tools/deploy';
import { R2 } from '@sys/driver-cloudflare/r2';
import { readInputs } from '../src/m.app/u.data.ts';
import { missingCredentialsError } from '../src/m.app/u.credentials.ts';
import { c, Is, ROOT, type t } from './common.ts';
import { selectPublication } from './u.selection.ts';
import { r2Failure, runTask } from './u.task.ts';

/**
 * Push the existing selected build. Never rebuild or resolve secrets into a file.
 */
export async function pushSample(
  audience: t.Audience,
  root = ROOT,
  publish: (args: t.DeployTool.PushDocumentArgs) => Promise<t.DeployTool.PushDocumentResult> =
    Deploy.push,
) {
  if (audience !== 'public' && audience !== 'private') {
    throw new Error('Invalid sample push target.');
  }
  const { config, buildRecord } = await readInputs(root);
  await selectPublication(buildRecord.selection, root);
  const target = config.targets[audience];
  const names = config.credentials[audience === 'private' ? 'pushPrivate' : 'pushPublic'];

  const endpoint = {
    provider: {
      kind: 'r2',
      accountId: config.accountId,
      bucket: target.bucket,
      prefix: target.prefix,
      credentials: {
        accessKeyId: `\${env:${names.accessKeyId}}`,
        secretAccessKey: `\${env:${names.secretAccessKey}}`,
      },
    },
    staging: { dir: `./dist.${audience}` },
    mappings: [],
  } satisfies t.DeployTool.Config.EndpointYaml.Doc;

  try {
    return await publish({ cwd: root, document: endpoint });
  } catch (error) {
    throw pushFailure(error, names);
  }
}

/** Preserve runtime denials and safe R2 summaries; never forward raw provider diagnostics. */
function pushFailure(error: unknown, names: t.CredentialNames): Error {
  const denial = R2.Error.permission(error);
  if (denial) return denial;
  // Only input-admission metadata from Deploy can become a setup message. Provider failures
  // stay redacted, and reported names must belong to this captured operation's credential pair.
  const failure = Is.error(error) && Is.record(error.cause) ? error.cause : undefined;
  const missing = failure?.missingEnv;
  if (
    failure?.ok === false && failure.source === 'document' && failure.reason === 'yaml-invalid' &&
    Is.array(missing) && missing.length > 0 && missing.every(Is.str) &&
    missing.every((name) => name === names.accessKeyId || name === names.secretAccessKey)
  ) return missingCredentialsError(missing);
  const detail = R2.Error.diagnostic(error);
  if (detail) return r2Failure(detail);
  return new Error('Sample R2 push failed. No automatic retry or cleanup was performed.');
}

/**
 * Main
 */
if (import.meta.main) {
  const [audience] = Deno.args;
  if (Deno.args.length !== 1 || (audience !== 'public' && audience !== 'private')) {
    throw new Error('Use deno task push, deno task push:public, or deno task push:private.');
  }
  const exitCode = await runTask(`push:${audience}`, async () => {
    const result = await Cli.Spinner.with(
      Cli.Fmt.spinnerText(`pushing ${c.cyan(audience)} inventory to R2…`, false),
      () => pushSample(audience),
    );
    const files = result.publish?.files ?? [];
    const written = files.filter((file) => file.status === 'written').length;
    const skipped = files.filter((file) => file.status === 'skipped').length;
    const removed = result.prune?.files.length ?? 0;
    const prefix = c.cyan(`R2 ${audience} push:`);
    console.info(`${prefix} ${written} written, ${skipped} skipped, ${removed} removed.`);
  });
  // Failure output and spinner cleanup have completed before terminating the command.
  if (exitCode !== 0) Deno.exit(exitCode);
}
