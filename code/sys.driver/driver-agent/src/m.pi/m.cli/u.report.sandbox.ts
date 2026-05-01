import { Fs, pkg, slug, type t } from './common.ts';
import { PiFs } from '../u.fs.ts';

type Input = {
  readonly cwd: t.StringDir;
  readonly sandbox: t.PiCli.SandboxSummary;
};

const LOG_SUFFIX = 'sandbox.log.md' as const;

export const PiSandboxReport = {
  dir(cwd: t.StringDir) {
    return Fs.join(cwd, PiFs.logDir);
  },

  fileOf(cwd: t.StringDir) {
    const stamp = Math.floor(Date.now() / 1000);
    return Fs.join(PiSandboxReport.dir(cwd), `${stamp}.${slug()}.${LOG_SUFFIX}`) as t.StringPath;
  },

  async write(input: Input) {
    const path = PiSandboxReport.fileOf(input.cwd);
    await Fs.ensureDir(Fs.dirname(path));
    await Fs.write(path, PiSandboxReport.text(input));
    return path;
  },

  text(input: Input) {
    const { sandbox } = input;
    const allowAll = sandbox.permissions === 'allow-all';
    const write = [sandbox.cwd.git, ...(sandbox.write?.detail ?? [])];
    const context = [
      ...(sandbox.context?.detail ?? []),
      ...(sandbox.context?.include ?? []),
    ];
    const lines = [
      '# Pi Sandbox Report',
      '',
      `- pkg: ${pkg.name}@${pkg.version}`,
      `- time: ${new Date().toISOString()}`,
      `- cwd.git: ${sandbox.cwd.git}`,
      `- cwd.invoked: ${sandbox.cwd.invoked}`,
      '',
      '## Summary',
      `- permissions: ${sandbox.permissions}`,
      `- read: ${allowAll ? 'all' : toSummary(sandbox.read)}`,
      `- write: ${allowAll ? 'all' : toSummary(sandbox.write, { temp: 'tmp' })}`,
      `- context: ${toContextSummary(sandbox.context)}`,
      '',
      '## Readable Paths',
      ...toCapabilityList(sandbox.permissions, sandbox.read?.detail ?? []),
      '',
      '## Writable Paths',
      ...toCapabilityList(sandbox.permissions, write),
      '',
      '## Context Files',
      ...toList(context),
      '',
    ];
    return lines.join('\n');
  },
} as const;

function toSummary(
  input?: t.PiCli.SandboxSummary.Scope,
  alias: Record<string, string> = {},
) {
  const items = (input?.summary ?? []).map((item) => alias[item] ?? item);
  if (items.length === 0) return '-';
  return items.join(' + ');
}

function toContextSummary(input?: t.PiCli.SandboxSummary['context']) {
  const items: string[] = [];
  if (input?.agents === 'walk-up') items.push('AGENTS.md walk-up');
  if ((input?.detail?.length ?? 0) > 0) items.push('discovered context');
  if ((input?.include?.length ?? 0) > 0) items.push('extra context');
  if (items.length === 0) return '-';
  return items.join(', ');
}

function toCapabilityList(permissions: t.PiCli.PermissionMode, items: readonly string[]) {
  if (permissions === 'allow-all') return ['- all (Deno --allow-all)'];
  return toList(items);
}

function toList(items: readonly string[]) {
  if (items.length === 0) return ['- none'];
  return items.map((item) => `- ${item}`);
}
