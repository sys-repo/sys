import { Fs, type t } from './common.ts';
import { resolveSandboxSummary } from '../m.cli/u.resolve.sandbox.ts';
import { ProfilesFs } from './u.fs.ts';
import { ProfileContext } from './u.context.ts';
import { ProfilePath } from './u.path.ts';
import { ProfileMigrate } from './u.migrate/mod.ts';
import { toPromptArgs } from './u.prompt.ts';
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
  const cwd = input.cwd;
  const root = ProfilePath.root(cwd);
  // --config is a CLI path. Profile-authored paths inside the YAML use ProfilePath/root below.
  const activeProfile = Fs.resolve(cwd.invoked, input.config) as t.StringPath;
  await ProfileMigrate.file(activeProfile);
  const checked = await ProfilesFs.validateYaml(activeProfile);
  if (!checked.ok) throw new Error(`Could not load profile config: ${Fs.trimCwd(activeProfile)}`);

  const profile = checked.doc;
  const prompt = profile.prompt;
  const capability = profile.sandbox?.capability;
  const context = profile.sandbox?.context;
  const contextResolution = await ProfileContext.resolve({
    cwd,
    append: context?.append,
    defaultSystem: prompt?.system == null,
  });
  const read = [
    ...ProfilePath.resolveAll(root, capability?.read),
    ...(input.read ?? []),
  ] as readonly t.StringPath[];
  const write = [
    ...ProfilePath.resolveAll(root, capability?.write),
    ...(input.write ?? []),
  ] as readonly t.StringPath[];
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
      ...toPromptArgs(prompt, { append: contextResolution.systemPromptAppend }),
      ...contextResolution.args,
      ...RuntimeMetadata.toPromptArgs({ cwd, profile: activeProfile }),
      ...(input.args ?? []),
    ],
    read,
    write,
    env: { ...(capability?.env ?? {}), ...(input.env ?? {}) },
    allowAll: input.allowAll,
    pkg: input.pkg,
    sandbox,
  };
}
