import { Fs, type t } from './common.ts';
import { resolveSandboxSummary } from '../m.cli/u.resolve.sandbox.ts';
import { ProfilesFs } from './u.fs.ts';

export type ResolvedProfileRun = {
  readonly cwd: t.StringDir;
  readonly args: readonly string[];
  readonly read: readonly t.StringPath[];
  readonly write: readonly t.StringPath[];
  readonly env: Record<string, string>;
  readonly pkg?: t.StringModuleSpecifier;
  readonly sandbox: t.PiCli.SandboxSummary;
};

export async function resolveRun(input: t.PiCliProfiles.RunArgs): Promise<ResolvedProfileRun> {
  const cwd = input.cwd ?? Fs.cwd('terminal');
  const config = Fs.resolve(cwd, input.config) as t.StringPath;
  const checked = await ProfilesFs.validateYaml(config);
  if (!checked.ok) throw new Error(`Could not load profile config: ${Fs.trimCwd(config)}`);

  const profile = checked.doc;
  const capability = profile.sandbox?.capability;
  const context = profile.sandbox?.context;
  const agents = context?.agents ?? 'walk-up';
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
    context: {
      agents,
      include: [...(context?.include ?? [])],
    },
  });

  return {
    cwd,
    args: [...(profile.args ?? []), ...(input.args ?? [])],
    read,
    write,
    env: { ...(capability?.env ?? {}), ...(input.env ?? {}) },
    pkg: input.pkg,
    sandbox,
  };
}
