import { Fs, type t } from '../common.ts';
import { resolveSandboxSummary } from '../../m.cli/u.resolve.sandbox.ts';
import { resolveTempArtifactRoots } from '../../m.cli/u.runtime.ts';
import { SandboxFs } from '../../m.extension/m.sandbox.fs/mod.ts';
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

export type ResolvedProfileRun = {
  readonly cwd: t.PiCli.Cwd;
  readonly args: readonly string[];
  readonly read: readonly t.StringPath[];
  readonly write: readonly t.StringPath[];
  readonly env: Record<string, string>;
  readonly allowAll?: boolean;
  readonly pkg?: t.StringModuleSpecifier;
  readonly sandbox: t.PiCli.SandboxSummary;
};

export async function resolveRun(input: t.PiCliProfiles.RunArgs): Promise<ResolvedProfileRun> {
  assertNoPromptSurfacePassthrough(input.args);
  const cwd = input.cwd;
  const root = ProfilePath.root(cwd);
  // Path-like --profile selectors are CLI paths.
  // Profile-authored paths inside YAML use ProfilePath/root below.
  const activeProfile = Fs.resolve(cwd.invoked, input.config) as t.StringPath;
  await ProfileMigrate.file(activeProfile);
  const checked = await ProfilesFs.validateYaml(activeProfile);
  if (!checked.ok) throw new Error(`Could not load profile config: ${Fs.trimCwd(activeProfile)}`);

  const profile = checked.doc;
  const prompt = profile.prompt;
  const capability = profile.sandbox?.capability;
  const context = profile.sandbox?.context;
  const env = { ...(capability?.env ?? {}), ...(input.env ?? {}) };
  await preflightOcrStartup({ pdf: profile.tools?.ocr?.pdf, env });
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
  const extension = hasEnabledSandboxFsTool(sandboxFsPolicy)
    ? await SandboxFs.write({ cwd: root, policy: sandboxFsPolicy })
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
      ...SandboxFs.toPromptArgs(sandboxFsPolicy),
      ...RuntimeMetadata.toPromptArgs({ cwd, profile: activeProfile }),
      ...(extension?.args ?? []),
      ...toFinalProvenanceSafetyArgs(),
      ...(input.args ?? []),
    ],
    read,
    write,
    env,
    allowAll: input.allowAll,
    pkg: input.pkg,
    sandbox,
  };
}

function hasEnabledSandboxFsTool(policy: t.PiSandboxFsExtension.Policy) {
  return policy.remove.enabled || policy.move.enabled || policy.copy.enabled;
}
