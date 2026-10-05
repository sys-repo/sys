import { ConfigRef, Err, Fs, Is, Pkg, Str, type t, Time } from '../common.ts';
import { EndpointsFs } from '../u.endpoints/mod.ts';
import { capturePushError, capturePushException } from '../u.error.ts';
import { PushPublishStats } from './u.publishStats.ts';
import { PushPruneStats } from './u.pruneStats.ts';
import { pushTarget } from './u.push.ts';
import { resolvePushTargets } from './u.resolvePushTargets.ts';

type StagingOutputCheck =
  | { readonly ok: true; readonly bytes: number }
  | {
    readonly ok: false;
    readonly target: t.PushTargetContext;
    readonly missing: t.PushMissingTarget;
  };

type PushIdentity =
  | Pick<t.DeployTool.PushResult, 'config'>
  | Pick<t.DeployTool.PushDocumentResult, 'source'>;
type PushOutcome =
  | Omit<t.DeployTool.PushResult, 'config'>
  | Omit<t.DeployTool.PushOperation.Failure, 'config'>;

/**
 * Push staged bytes using one file or captured-document authority.
 */
export function push(args: t.DeployTool.PushFileArgs): Promise<t.DeployTool.PushResult>;
export function push(args: t.DeployTool.PushDocumentArgs): Promise<t.DeployTool.PushDocumentResult>;
export function push(
  args: t.DeployTool.PushArgs,
): Promise<t.DeployTool.PushResult | t.DeployTool.PushDocumentResult>;
export async function push(
  args: t.DeployTool.PushArgs,
): Promise<t.DeployTool.PushResult | t.DeployTool.PushDocumentResult> {
  try {
    const cwd = args.cwd ?? Fs.cwd('terminal');
    const force = args.force;

    if ('document' in args) {
      if ('config' in args || 'paths' in args) {
        throw new Error('Deploy.push: document and config references are mutually exclusive.');
      }
      const identity = { source: 'document' } as const;
      const check = await EndpointsFs.validateDocument(args.document!, { cwd });
      const result = { ...await executePush({ cwd, force, identity, check }), ...identity };
      if (!result.ok) throw pushError(result);
      return result;
    }

    const config = ConfigRef.resolve(cwd, args, 'Deploy.push');
    const result = await pushEndpoint({ cwd, config, force });
    if (!result.ok) throw pushError(result);
    return result;
  } catch (error) {
    // Capture admission failures too, without replacing directly thrown exceptions.
    capturePushException(error);
    throw error;
  }
}

/** Push an already-staged deploy endpoint from owner YAML without throwing on expected failures. */
export async function pushEndpoint(args: {
  cwd: t.StringDir;
  config: t.StringPath;
  force?: boolean;
}): Promise<t.DeployTool.PushOperation.Result> {
  const { cwd } = args;
  const config: t.StringPath = Fs.resolve(cwd, args.config);
  const force = args.force;
  const check = await EndpointsFs.validateYaml(config, { cwd });
  return { ...await executePush({ cwd, force, identity: { config }, check }), config };
}

/** Source admission differs; target checks and provider execution do not. */
async function executePush(args: {
  cwd: t.StringDir;
  force?: boolean;
  identity: PushIdentity;
  check: t.DeployTool.Endpoint.Fs.YamlCheck;
}): Promise<PushOutcome> {
  const { cwd, identity, check } = args;
  const fail = (details: Omit<t.DeployTool.PushOperation.Failure, 'ok' | 'cwd' | 'config'>) =>
    ({ ok: false, cwd, ...details }) as const;

  if (!check.ok) {
    return fail({
      reason: 'yaml-invalid',
      error: validationError(identity, check),
      ...(check.missingEnv?.length ? { missingEnv: check.missingEnv } : {}),
    });
  }

  const yaml = check.doc;
  const provider = yaml.provider;
  if (!provider) {
    return fail({
      reason: 'no-provider',
      hint: 'No provider configured for this endpoint.',
    });
  }

  let plan: t.PushTargetPlan;
  try {
    plan = await resolvePushTargets({ cwd, yaml });
  } catch (error) {
    return fail({
      reason: 'failed',
      hint: 'Failed to resolve deploy push targets.',
      error,
    });
  }

  const missing = plan.missing;
  if (missing.length) {
    return fail({
      reason: 'no-staging-output',
      hint: 'Run staging first (no staging output found).',
      missing,
    });
  }

  const targets = plan.targets;
  if (!targets.length) {
    return fail({
      reason: 'no-push-targets',
      hint: 'No deploy targets resolved for this provider.',
    });
  }

  const stagingOutput = await checkStagingOutputs(targets);
  if (!stagingOutput.ok) {
    return fail({
      reason: 'no-staging-output',
      hint: 'Run staging first (no staging output found).',
      target: stagingOutput.target,
      missing: [stagingOutput.missing],
    });
  }

  const started = Time.now.timestamp;
  const bytesTotal = stagingOutput.bytes;
  const publishStats: t.PushPublishStats[] = [];
  const pruneStats: t.PushPruneStats[] = [];

  for (const [index, target] of targets.entries()) {
    const context = targetContext(target, index);
    try {
      const result = await pushTarget({ cwd, target, force: args.force });
      if (!result.ok) {
        return fail({
          reason: result.reason,
          hint: result.hint,
          target: context,
          error: result.error,
        });
      }
      if (result.publish) publishStats.push(result.publish);
      if (result.prune) pruneStats.push(result.prune);
    } catch (error) {
      return fail({
        reason: 'failed',
        hint: 'Provider push failed.',
        target: context,
        error,
      });
    }
  }

  const bytes = bytesTotal || undefined;
  const publish = PushPublishStats.merge(publishStats);
  const prune = PushPruneStats.merge(pruneStats);
  return {
    ok: true,
    cwd,
    targets: targets.length,
    elapsed: Time.elapsed(started).toString(),
    bytes,
    publish,
    prune,
  };
}

/**
 * Helpers:
 */
function sourceLabel(identity: PushIdentity): string {
  return 'config' in identity ? `config: ${Fs.trimCwd(identity.config)}` : 'document';
}

function validationError(
  identity: PushIdentity,
  check: t.DeployTool.Endpoint.Fs.YamlCheck,
): Error {
  const details = errorMessagesOf(check);
  const suffix = details ? `\n${details}` : '';
  return new Error(`Could not load deploy ${sourceLabel(identity)}${suffix}`);
}

function pushError(
  result: t.DeployTool.PushOperation.Failure | t.DeployTool.PushOperation.DocumentFailure,
): Error {
  const error = capturePushError(result);
  const b = Str.builder()
    .line(`Deploy.push: failed to push ${sourceLabel(result)}`)
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

  error.message = String(b);
  return error;
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
  const domain = trimText(target.domain) ?? trimText(provider.readOrigin);
  const stagingDir: t.StringDir | undefined = trimText(target.stagingDir);

  return {
    index,
    provider: providerKind,
    sourceDir: target.sourceDir,
    stagingDir,
    domain,
    bucket: trimText(provider.bucket),
    prefix: trimText(provider.prefix),
  };
}

function trimText(input: unknown): string | undefined {
  const text = String(input ?? '').trim();
  return text || undefined;
}
