import { Fs, type t } from '../common.ts';
import { resolvePkg } from '../../u/u.resolve.pkg.ts';
import { resolveSandboxSummary } from '../../u/u.resolve.sandbox.ts';
import { resolveTempArtifactRoots } from '../../u/u.runtime.ts';
import { Ocr } from '../../../m.core/m.extension/m.ocr/mod.ts';
import { SandboxFs } from '../../../m.core/m.extension/m.sandbox.fs/mod.ts';
import { ProfileMigrate } from '../u.migrate/mod.ts';
import { ProfileContext } from './u.context.ts';
import { ProfilesFs } from './u.fs.ts';
import { ProfilePath } from './u.path.ts';
import {
  assertNoPromptSurfacePassthrough,
  toFinalProvenanceSafetyArgs,
  toPromptArgs,
} from './u.prompt.ts';
import { preflightOcrStartup } from './u.ocr.preflight.ts';
import { RuntimeMetadata } from './u.runtime.metadata.ts';
import {
  PI_BUILTIN_TOOL_NAMES,
  PI_TOOL_SELECTION_IMPORT,
  resolveActiveToolNames,
} from './u.resolve.tools.ts';

export type ResolvedProfileRun = {
  readonly cwd: t.PiCli.Cwd;
  readonly args: readonly string[];
  readonly read: readonly t.StringPath[];
  readonly write: readonly t.StringPath[];
  readonly env: Record<string, string>;
  readonly allowAll?: boolean;
  readonly pkg: t.StringModuleSpecifier;
  readonly sandbox: t.PiCli.SandboxSummary;
  readonly tools?: readonly string[];
};

export type ResolveRunOptions = {
  /** Whether to run and persist launcher-owned extensions. */
  readonly extensions?: boolean;
  /** Preflight behavior override. */
  readonly ocrPreflight?: boolean;
};

export async function resolveRun(
  input: t.PiCliProfiles.RunArgs,
  options: ResolveRunOptions = {},
): Promise<ResolvedProfileRun> {
  assertNoPromptSurfacePassthrough(input.args);
  const cwd = input.cwd;
  const root = ProfilePath.root(cwd);
  const withExtensions = options.extensions !== false;
  const runOcrPreflight = options.ocrPreflight !== false && input.ocr?.preflight !== false;

  // Path-like --profile selectors are CLI paths.
  // Profile-authored paths inside YAML use ProfilePath/root below.
  const activeProfile = Fs.resolve(cwd.invoked, input.config) as t.StringPath;
  await ProfileMigrate.file(activeProfile);
  const checked = await ProfilesFs.validateYaml(activeProfile);
  if (!checked.ok) throw new Error(`Could not load profile config: ${Fs.trimCwd(activeProfile)}`);

  const pkg = await resolvePkg({ cwd: root, pkg: input.pkg });
  const profile = checked.doc;
  const prompt = profile.prompt;
  const capability = profile.sandbox?.capability;
  const context = profile.sandbox?.context;
  const env = { ...(capability?.env ?? {}), ...(input.env ?? {}) };
  const ocrPreflight = runOcrPreflight
    ? await preflightOcrStartup({
      pdf: profile.tools?.ocr?.pdf,
      env,
      setup: {
        installDeps: input.ocr?.installDeps === true,
        interactive: input.ocr?.interactive === true,
      },
    })
    : { enabled: false as const };
  const contextResolution = await ProfileContext.resolve({
    cwd,
    append: context?.append,
    defaultSystem: prompt?.system == null,
  });
  const read = [
    ...ProfilePath.resolveAll(root, capability?.read),
    ...(input.read ?? []),
  ] as readonly t.StringPath[];
  const profileWrite = ProfilePath.resolveAll(root, capability?.write);
  const callerWrite = input.write ?? [];
  const write = [
    ...profileWrite,
    ...callerWrite,
  ] as readonly t.StringPath[];
  const tempArtifactRoots = await resolveTempArtifactRoots();
  const sandboxFsPolicy = SandboxFs.resolvePolicy({
    cwd,
    read: [
      ...ProfilePath.resolveAll(root, [...(capability?.read ?? []), ...(input.read ?? [])]),
      ...tempArtifactRoots,
    ],
    write: [...profileWrite, ...ProfilePath.resolveAll(root, callerWrite)],
    remove: profile.tools?.remove,
    move: profile.tools?.move,
    copy: profile.tools?.copy,
  });
  const extension = withExtensions && hasEnabledSandboxFsTool(sandboxFsPolicy)
    ? await SandboxFs.write({ cwd: root, policy: sandboxFsPolicy })
    : undefined;
  const ocrExtension = withExtensions && ocrPreflight.enabled
    ? await Ocr.write({
      cwd: root,
      policy: Ocr.resolveExtensionPolicy({
        cwd,
        read,
        policy: ocrPreflight.policy,
        executables: ocrPreflight.executables,
        installCommand: ocrPreflight.installCommand,
      }),
    })
    : undefined;
  const ocrTools = ocrPreflight.enabled && ocrExtension ? Ocr.toolNames(ocrPreflight.policy) : [];
  const tools = pkg === PI_TOOL_SELECTION_IMPORT
    ? resolveActiveToolNames({
      args: [...(input.args ?? [])],
      source: {
        builtin: [...PI_BUILTIN_TOOL_NAMES],
        extension: [
          ...(extension ? SandboxFs.toolNames(sandboxFsPolicy) : []),
          ...ocrTools,
        ],
      },
    })
    : undefined;
  const sandbox = await resolveSandboxSummary({
    cwd,
    read,
    write,
    allowAll: input.allowAll,
    context: {
      include: contextResolution.include,
    },
  });

  return {
    cwd,
    args: [
      ...toPromptArgs(prompt, {
        append: contextResolution.systemPromptAppend,
        finalSafety: false,
      }),
      ...contextResolution.args,
      ...(withExtensions ? SandboxFs.toPromptArgs(sandboxFsPolicy) : []),
      ...(withExtensions && ocrPreflight.enabled ? Ocr.toPromptArgs(ocrPreflight.policy) : []),
      ...RuntimeMetadata.toPromptArgs({ cwd, profile: activeProfile }),
      ...(extension?.args ?? []),
      ...(ocrExtension?.args ?? []),
      ...toFinalProvenanceSafetyArgs(),
      ...(input.args ?? []),
    ],
    read,
    write,
    env,
    allowAll: input.allowAll,
    pkg,
    sandbox,
    ...(tools ? { tools } : {}),
  };
}

function hasEnabledSandboxFsTool(policy: t.PiSandboxFsExtension.Policy) {
  return policy.remove.enabled || policy.move.enabled || policy.copy.enabled;
}
