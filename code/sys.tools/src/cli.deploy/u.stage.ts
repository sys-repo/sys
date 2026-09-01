import { ConfigRef, Err, Fs, Is, Path, Str, type t } from './common.ts';
import { EndpointsFs } from './u.endpoints/mod.ts';
import { resolveBases } from './u.endpoints/u.resolve.ts';
import {
  resolveMappingsForStaging,
  stageMappings,
  type StageMappingsArgs,
  type StageMappingsResult,
} from './u.staging/mod.ts';

type StagePlanBase = {
  readonly cwd: t.StringDir;
  readonly config: t.StringPath;
  readonly stagingRoot: t.StringAbsoluteDir;
};

type StagePlanStage =
  & Readonly<
    Omit<StageMappingsArgs, 'mappings' | 'onProgress' | 'until'>
  >
  & {
    readonly mappings: readonly t.DeployTool.Staging.Mapping[];
  };

export type StagePlan = StagePlanBase & {
  readonly kind: 'mappings';
  readonly stage: StagePlanStage;
};

export type StagePlanLoadResult =
  | { readonly ok: true; readonly plan: StagePlan }
  | {
    readonly ok: false;
    readonly cwd: t.StringDir;
    readonly config: t.StringPath;
    readonly stagingRoot?: t.StringAbsoluteDir;
    readonly error: unknown;
  };

/** Stage a deploy endpoint from owner YAML. Throws when staging fails. */
export async function stage(args: t.DeployTool.StageArgs): Promise<t.DeployTool.StageResult> {
  const cwd = args.cwd ?? Fs.cwd('terminal');
  const config = ConfigRef.resolve(cwd, args, 'Deploy.stage');
  const until = args.until;
  const result = await stageEndpoint({ cwd, config, until });

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
  const stagingRoot: t.StringAbsoluteDir = bases.stagingBaseAbs;

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

  const mappings = snapshotMappings(resolved.mappings);
  const stage = Object.freeze({
    cwd,
    mappings,
    sourceRoot: bases.sourceRoot,
    stagingRoot: bases.stagingRoot,
    buildResetHtml: yaml.staging.html?.buildReset === true,
  });
  const plan: StagePlan = Object.freeze({
    kind: 'mappings',
    cwd,
    config,
    stagingRoot,
    stage,
  });
  return Object.freeze({ ok: true, plan });
}

/** Stage a loaded endpoint plan without presentation side-effects. */
export async function stagePlan(
  plan: StagePlan,
  options: {
    onProgress?: StageMappingsArgs['onProgress'];
    until?: t.UntilInput;
  } = {},
): Promise<t.DeployTool.StageOperation.Result> {
  try {
    const input = plan.stage;
    const stage: StageMappingsArgs = {
      cwd: input.cwd,
      mappings: [...snapshotMappings(input.mappings)],
      stagingRoot: input.stagingRoot,
      ...(input.sourceRoot === undefined ? {} : { sourceRoot: input.sourceRoot }),
      ...(input.buildResetHtml === undefined ? {} : { buildResetHtml: input.buildResetHtml }),
      ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress }),
      ...(options.until === undefined ? {} : { until: options.until }),
    };
    const staged = await stageMappings(stage);
    return stageOk(plan, staged);
  } catch (error) {
    return stageFailed(plan, error);
  }
}

/** Stage a deploy endpoint from owner YAML without throwing on expected failures. */
export async function stageEndpoint(args: {
  cwd: t.StringDir;
  config: t.StringPath;
  until?: t.UntilInput;
}): Promise<t.DeployTool.StageOperation.Result> {
  const loaded = await loadStagePlan(args);
  if (!loaded.ok) return loaded;
  return await stagePlan(loaded.plan, { until: args.until });
}

function stageOk(
  plan: Pick<StagePlanBase, 'cwd' | 'config'>,
  staged: StageMappingsResult,
): t.DeployTool.StageResult {
  return Object.freeze({
    ok: true,
    cwd: plan.cwd,
    config: plan.config,
    stagingRoot: staged.stagingRoot,
    verification: staged.verification,
  });
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

function snapshotMappings(
  mappings: readonly t.DeployTool.Staging.Mapping[],
): readonly t.DeployTool.Staging.Mapping[] {
  return Object.freeze(
    mappings.map((mapping, index): t.DeployTool.Staging.Mapping => {
      const mode = mapping?.mode;
      if (mode !== 'copy' && mode !== 'build+copy' && mode !== 'index') {
        throw new Error(
          `Deploy staging mapping[${index}] is invalid: unsupported mode: ${String(mode)}.`,
        );
      }
      return Object.freeze({
        mode,
        dir: Object.freeze({
          source: String(mapping.dir?.source ?? ''),
          staging: String(mapping.dir?.staging ?? '') as t.StringRelativeDir,
        }),
      });
    }),
  );
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
