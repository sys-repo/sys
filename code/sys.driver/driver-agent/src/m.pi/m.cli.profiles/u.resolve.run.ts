import { Fs, type t } from './common.ts';
import { resolveSandboxSummary } from '../m.cli/u.resolve.sandbox.ts';
import { ProfilesFs } from './u.fs.ts';
import { toPromptArgs } from './u.prompt.ts';

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
  const config = Fs.resolve(cwd.invoked, input.config) as t.StringPath;
  const checked = await ProfilesFs.validateYaml(config);
  if (!checked.ok) throw new Error(`Could not load profile config: ${Fs.trimCwd(config)}`);

  const profile = checked.doc;
  const prompt = profile.prompt;
  const capability = profile.sandbox?.capability;
  const context = profile.sandbox?.context;
  const read = [
    ...(capability?.read ?? []),
    ...(context?.include ?? []),
    ...(input.read ?? []),
  ] as readonly t.StringPath[];
  const write = [...(capability?.write ?? []), ...(input.write ?? [])] as readonly t.StringPath[];
  const sandbox = await resolveSandboxSummary({
    cwd,
    read,
    write,
    allowAll: input.allowAll,
    context: {
      agents: 'walk-up', // Include the nearest AGENTS.md and continue upward through parent folders.
      include: [...(context?.include ?? [])],
    },
  });

  return {
    cwd,
    args: [...toPromptArgs(prompt), ...(input.args ?? [])],
    read,
    write,
    env: { ...(capability?.env ?? {}), ...(input.env ?? {}) },
    allowAll: input.allowAll,
    pkg: input.pkg,
    sandbox,
  };
}
