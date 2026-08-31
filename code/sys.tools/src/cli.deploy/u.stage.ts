import { ConfigRef, Err, Fs, Is, Path, Str, type t } from './common.ts';
import { EndpointsFs } from './u.endpoints/mod.ts';
import { resolveBases } from './u.endpoints/u.resolve.ts';
import {
  resolveMappingsForStaging,
  stageMappings,
  type StageMappingsArgs,
} from './u.staging/mod.ts';

type StagePlanBase = {
  readonly cwd: t.StringDir;
  readonly config: t.StringPath;
  readonly yaml: t.DeployTool.Config.EndpointYaml.Doc;
  readonly stagingRoot: t.StringDir;
};

export type StagePlan = StagePlanBase & {
  readonly kind: 'mappings';
  readonly stage: StageMappingsArgs;
};

export type StagePlanLoadResult =
  | { readonly ok: true; readonly plan: StagePlan }
  | {
    readonly ok: false;
    readonly cwd: t.StringDir;
    readonly config: t.StringPath;
    readonly stagingRoot?: t.StringDir;
    readonly error: unknown;
  };

/** Stage a deploy endpoint from owner YAML. Throws when staging fails. */
export async function stage(args: t.DeployTool.StageArgs): Promise<t.DeployTool.StageResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const config = ConfigRef.resolve(cwd, args, 'Deploy.stage');
  const result = await stageEndpoint({ cwd, config });

  if (!result.ok) throw stageError(config, result.error);
  return result;
}

/** Load and resolve a deploy endpoint stage plan without executing it. */
export async function loadStagePlan(args: {
  cwd: t.StringDir;
  config: t.StringPath;
}): Promise<StagePlanLoadResult> {
  const { cwd } = args;
  const config: t.StringPath = Fs.resolve(cwd, args.config);
  const check = await EndpointsFs.validateYaml(config, { cwd });

  if (!check.ok) {
    return { ok: false, cwd, config, error: validationError(config, check) };
  }

  const yaml = check.doc;
  const bases = resolveBases(cwd, yaml);
  const stagingRoot: t.StringDir = bases.stagingBaseAbs;

  const resolved = await resolveMappingsForStaging({
    cwd,
    yamlPath: displayConfigPath(cwd, config),
    yaml,
  });
  if (!resolved.ok) {
    const error = new Error(
      `Deploy.stage: failed to resolve staging mappings: ${Fs.trimCwd(config)}`,
    );
    return { ok: false, cwd, config, stagingRoot, error };
  }

  return {
    ok: true,
    plan: {
      kind: 'mappings',
      cwd,
      config,
      yaml,
      stagingRoot,
      stage: {
        cwd,
        mappings: resolved.mappings,
        sourceRoot: bases.sourceRoot,
        stagingRoot: bases.stagingRoot,
        clear: yaml.staging?.clear === true,
        buildResetHtml: yaml.staging?.html?.buildReset === true,
      },
    },
  };
}

/** Stage a loaded endpoint plan without presentation side-effects. */
export async function stagePlan(
  plan: StagePlan,
  options: { onProgress?: StageMappingsArgs['onProgress'] } = {},
): Promise<t.DeployTool.StageOperation.Result> {
  try {
    const stage = options.onProgress
      ? { ...plan.stage, onProgress: options.onProgress }
      : plan.stage;
    const staged = await stageMappings(stage);
    return stageOk(plan, staged.stagingRoot);
  } catch (error) {
    return stageFailed(plan, error);
  }
}

/** Stage a deploy endpoint from owner YAML without throwing on expected failures. */
export async function stageEndpoint(args: {
  cwd: t.StringDir;
  config: t.StringPath;
}): Promise<t.DeployTool.StageOperation.Result> {
  const loaded = await loadStagePlan(args);
  if (!loaded.ok) return loaded;
  return await stagePlan(loaded.plan);
}

function stageOk(
  plan: Pick<StagePlanBase, 'cwd' | 'config'>,
  stagingRoot: t.StringDir,
): t.DeployTool.StageResult {
  return { ok: true, cwd: plan.cwd, config: plan.config, stagingRoot };
}

function stageFailed(
  plan: Pick<StagePlanBase, 'cwd' | 'config' | 'stagingRoot'>,
  error: unknown,
): t.DeployTool.StageOperation.Result {
  return {
    ok: false,
    cwd: plan.cwd,
    config: plan.config,
    stagingRoot: plan.stagingRoot,
    error,
  };
}

function validationError(
  config: t.StringPath,
  check: t.DeployTool.Endpoint.Fs.YamlCheck,
): Error {
  const details = errorMessagesOf(check);
  const suffix = details ? `\n${details}` : '';
  return new Error(`Could not load deploy config: ${Fs.trimCwd(config)}${suffix}`);
}

function stageError(config: t.StringPath, error: unknown): Error {
  const detail = error ? Err.summary(error, { cause: true, stack: false }) : '';
  const suffix = detail ? `\n${detail}` : '';
  return new Error(`Deploy.stage: failed to stage config: ${Fs.trimCwd(config)}${suffix}`, {
    cause: error,
  });
}

function displayConfigPath(cwd: t.StringDir, config: t.StringPath): t.StringPath {
  const rel = Path.relative(cwd, config);
  if (!String(rel).trim() || String(rel).startsWith('..')) return config;
  return `./${Str.trimLeadingDotSlash(rel)}`;
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
