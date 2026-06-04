import { ConfigRef, Err, Fs, Is, Pkg, Str, type t, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { PushPublishStats } from './u.publishStats.ts';
import { pushProvider } from './u.push.ts';
import { resolvePushTargets } from './u.resolvePushTargets.ts';

type StagingOutputCheck =
  | { readonly ok: true; readonly bytes: number }
  | {
    readonly ok: false;
    readonly target: t.PushTargetContext;
    readonly missing: t.PushMissingTarget;
  };

/** Push an already-staged deploy endpoint from owner YAML. Throws when push fails. */
export async function push(args: t.DeployTool.PushArgs): Promise<t.DeployTool.PushResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const config = ConfigRef.resolve(cwd, args, 'Deploy.push');
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

  const missing = plan.missing;
  if (missing.length) {
    return failure({
      cwd,
      config,
      reason: 'no-staging-output',
      hint: 'Run staging first (no staging output found).',
      missing,
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

  const stagingOutput = await checkStagingOutputs(targets);
  if (!stagingOutput.ok) {
    return failure({
      cwd,
      config,
      reason: 'no-staging-output',
      hint: 'Run staging first (no staging output found).',
      target: stagingOutput.target,
      missing: [stagingOutput.missing],
    });
  }

  const started = Time.now.timestamp;
  const bytesTotal = stagingOutput.bytes;
  const publishStats: t.PushPublishStats[] = [];

  for (const [index, target] of targets.entries()) {
    const context = targetContext(target, index);
    try {
      const result = await pushProvider({ cwd, target });
      if (!result.ok) {
        return failure({
          cwd,
          config,
          reason: result.reason,
          hint: result.hint,
          target: context,
          error: result.error,
        });
      }
      if (result.publish) publishStats.push(result.publish);
    } catch (error) {
      return failure({
        cwd,
        config,
        reason: 'failed',
        hint: 'Provider push failed.',
        target: context,
        error,
      });
    }
  }

  const shards = targets.filter((target) => Is.num(target.shard)).length || undefined;
  const bytes = bytesTotal || undefined;
  const publish = PushPublishStats.merge(publishStats);
  return {
    ok: true,
    cwd,
    config,
    targets: targets.length,
    elapsed: Time.elapsed(started).toString(),
    shards,
    bytes,
    publish,
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

  const target = formatTargetContext(result.target);
  if (target) b.line(`target: ${target}`);

  const missing = result.missing ?? [];
  if (missing.length) {
    b.line(`missing: ${missing.length}`);
    for (const line of formatMissingTargets(missing)) b.line(line);
  }

  const detail = result.error ? Err.summary(result.error, { cause: true, stack: false }) : '';
  if (detail) b.line(detail);

  return new Error(String(b), { cause: result });
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

function formatMissingTargets(missing: readonly t.PushMissingTarget[]): readonly string[] {
  const shown = missing.slice(0, 5);
  const lines = shown.map((target) => {
    const context = formatTargetContext(target);
    return context ? `- ${target.reason}: ${context}` : `- ${target.reason}`;
  });
  const rest = missing.length - shown.length;
  if (rest > 0) lines.push(`- ${rest} more missing targets`);
  return lines;
}

function formatTargetContext(context?: t.PushTargetContext): string {
  if (!context) return '';

  const parts: string[] = [];
  if (Is.num(context.index)) parts.push(`#${context.index + 1}`);
  parts.push(`provider=${context.provider}`);
  if (Is.num(context.shard)) parts.push(`shard=${context.shard}`);
  if (context.siteId) parts.push(`siteId=${context.siteId}`);
  if (context.bucket) parts.push(`bucket=${context.bucket}`);
  if (context.prefix) parts.push(`prefix=${context.prefix}`);
  if (context.domain) parts.push(`domain=${context.domain}`);
  if (context.stagingDir) parts.push(`staging=${Fs.trimCwd(context.stagingDir)}`);
  return parts.join(' ');
}

async function checkStagingOutputs(
  targets: readonly t.PushTarget[],
): Promise<StagingOutputCheck> {
  let bytes = 0;
  for (const [index, target] of targets.entries()) {
    const output = await targetStagingOutput(target, index);
    if (!output.ok) return output;
    bytes += output.bytes;
  }
  return { ok: true, bytes };
}

async function targetStagingOutput(
  target: t.PushTarget,
  index: number,
): Promise<StagingOutputCheck> {
  const context = targetContext(target, index);

  try {
    const stagingDir = String(target.stagingDir ?? '').trim();
    if (!stagingDir) return missingOutput(context, 'missing-staging-output');
    if (!(await Fs.exists(stagingDir))) return missingOutput(context, 'missing-staging-output');

    const dist = (await Pkg.Dist.load(stagingDir)).dist;
    const digest = dist?.hash?.digest;
    if (!Is.str(digest) || !digest.trim()) {
      return missingOutput(context, 'missing-dist-metadata');
    }

    const total = dist?.build.size.total;
    return { ok: true, bytes: Is.num(total) ? total : 0 };
  } catch {
    return missingOutput(context, 'missing-dist-metadata');
  }
}

function missingOutput(
  target: t.PushTargetContext,
  reason: t.PushMissingTarget['reason'],
): StagingOutputCheck {
  return { ok: false, target, missing: { ...target, reason } };
}

function targetContext(target: t.PushTarget, index: number): t.PushTargetContext {
  const provider = target.provider;
  const providerKind = String(provider.kind ?? '').trim() || 'unknown';
  const providerDomain = provider.kind === 'orbiter'
    ? trimText(provider.domain)
    : provider.kind === 'r2'
    ? trimText(provider.readOrigin)
    : undefined;
  const siteId = provider.kind === 'orbiter' ? trimText(provider.siteId) : undefined;
  const bucket = provider.kind === 'r2' ? trimText(provider.bucket) : undefined;
  const prefix = provider.kind === 'r2' ? trimText(provider.prefix) : undefined;
  const domain = trimText(target.domain) ?? providerDomain;
  const stagingDir = trimText(target.stagingDir) as t.StringDir | undefined;

  return {
    index,
    provider: providerKind,
    sourceDir: target.sourceDir,
    stagingDir,
    shard: Is.num(target.shard) ? target.shard : undefined,
    domain,
    siteId,
    bucket,
    prefix,
  };
}

function trimText(input: unknown): string | undefined {
  const text = String(input ?? '').trim();
  return text || undefined;
}
