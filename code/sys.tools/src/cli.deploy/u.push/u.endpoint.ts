import { Err, Fs, Is, Path, Pkg, Str, type t, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { pushProvider } from './u.push.ts';
import { resolvePushTargets } from './u.resolvePushTargets.ts';

/** Push an already-staged deploy endpoint from owner YAML. Throws when push fails. */
export async function push(args: t.DeployTool.PushArgs): Promise<t.DeployTool.PushResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const config = Fs.resolve(cwd, args.config) as t.StringPath;
  const result = await pushEndpoint({ cwd, config });

  if (!result.ok) throw pushError(config, result);
  return result;
}

/** Push an already-staged deploy endpoint from owner YAML without throwing on expected failures. */
export async function pushEndpoint(args: {
  cwd: t.StringDir;
  config: t.StringPath;
}): Promise<t.DeployTool.PushOperation.Result> {
  const { cwd } = args;
  const config = Fs.resolve(cwd, args.config) as t.StringPath;
  const check = await EndpointsFs.validateYaml(config, { cwd });

  if (!check.ok) {
    return failure({
      cwd,
      config,
      reason: 'yaml-invalid',
      hint: errorMessagesOf(check) || undefined,
      error: validationError(config, check),
    });
  }

  const yaml = check.doc;
  const provider = yaml.provider;
  if (!provider) {
    return failure({
      cwd,
      config,
      reason: 'no-provider',
      hint: 'No provider configured for this endpoint.',
    });
  }

  let plan: t.PushTargetPlan;
  try {
    plan = await resolvePushTargets({ cwd, yaml });
  } catch (error) {
    return failure({
      cwd,
      config,
      reason: 'failed',
      hint: 'Failed to resolve deploy push targets.',
      error,
    });
  }

  const targets = plan.targets;
  if (!targets.length) {
    return failure({
      cwd,
      config,
      reason: provider.kind === 'orbiter' ? 'no-staging-output' : 'no-push-targets',
      hint: provider.kind === 'orbiter'
        ? 'Run staging first (no staging output found).'
        : 'No deploy targets resolved for this provider.',
    });
  }

  const started = Time.now.timestamp;
  let bytesTotal = 0;

  for (const target of targets) {
    try {
      const result = await pushProvider({ cwd, target });
      if (!result.ok) {
        return failure({
          cwd,
          config,
          reason: result.reason,
          hint: result.hint,
          error: result.error,
        });
      }
    } catch (error) {
      return failure({
        cwd,
        config,
        reason: 'failed',
        hint: 'Provider push failed.',
        error,
      });
    }

    bytesTotal += await targetBytes(target);
  }

  const shards = targets.filter((target) => Is.num(target.shard)).length || undefined;
  const bytes = bytesTotal || undefined;
  return {
    ok: true,
    cwd,
    config,
    targets: targets.length,
    elapsed: Time.elapsed(started).toString(),
    shards,
    bytes,
  };
}

/**
 * Helpers:
 */
function failure(
  args: Omit<t.DeployTool.PushOperation.Failure, 'ok'>,
): t.DeployTool.PushOperation.Failure {
  return { ok: false, ...args };
}

function validationError(
  config: t.StringPath,
  check: t.DeployTool.Endpoint.Fs.YamlCheck,
): Error {
  const details = errorMessagesOf(check);
  const suffix = details ? `\n${details}` : '';
  return new Error(`Could not load deploy config: ${Fs.trimCwd(config)}${suffix}`);
}

function pushError(config: t.StringPath, result: t.DeployTool.PushOperation.Failure): Error {
  const b = Str.builder()
    .line(`Deploy.push: failed to push config: ${Fs.trimCwd(config)}`)
    .line(`reason: ${result.reason}`);

  const hint = String(result.hint ?? '').trim();
  if (hint) b.line(hint);

  const detail = result.error ? Err.summary(result.error, { cause: true, stack: false }) : '';
  if (detail) b.line(detail);

  return new Error(String(b), { cause: result.error });
}

function errorMessagesOf(check: t.DeployTool.Endpoint.Fs.YamlCheck): string {
  if (check.ok) return '';

  return check.errors
    .map((error) => {
      const message = (error as { readonly message?: unknown }).message;
      return Is.str(message) ? message.trim() : '';
    })
    .filter((message) => message.length > 0)
    .join('\n');
}

async function targetBytes(target: t.PushTarget): Promise<number> {
  try {
    const stagingDir = String(target.stagingDir ?? '').trim();
    if (!stagingDir) return 0;

    const dist = (await Pkg.Dist.load(Path.join(stagingDir, '.'))).dist;
    const total = dist?.build.size.total;
    return Is.num(total) ? total : 0;
  } catch {
    return 0;
  }
}
