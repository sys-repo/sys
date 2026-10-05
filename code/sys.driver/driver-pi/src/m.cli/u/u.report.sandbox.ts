import { Fs, pkg, slug, type t } from '../common.ts';
import { runtimeRoot } from './u.runtime.ts';
import { PiFs } from '../../m.core/u.fs.ts';
import { PiAuthority } from './u.authority.ts';

type Input = {
  readonly cwd: t.StringDir;
  readonly sandbox: t.PiCli.SandboxSummary;
  readonly gitRootExplicit?: boolean;
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
    const root = runtimeRoot(sandbox.cwd);
    const write = [root, ...(sandbox.write?.detail ?? [])];
    const context = [...(sandbox.context?.include ?? [])];
    const git = sandbox.cwd.git ? [`- cwd.git: ${sandbox.cwd.git}`] : [];
    const lines = [
      '# Pi Deno Permissions and Launcher Inputs',
      '',
      `- pkg: ${pkg.name}@${pkg.version}`,
      `- time: ${new Date().toISOString()}`,
      `- cwd.root: ${root}`,
      ...git,
      `- cwd.git-root: ${input.gitRootExplicit === true ? 'explicit' : 'inferred'}`,
      `- cwd.invoked: ${sandbox.cwd.invoked}`,
      '',
      '## Authority',
      `- Deno API permissions: ${sandbox.permissions}`,
      `- Process sandbox: ${PiAuthority.process}`,
      `- Outer sandbox: ${PiAuthority.enclosure}`,
      `- ${PiAuthority.limitation}`,
      '',
      ...launchLines(sandbox.launch),
      '',
      '## Summary',
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

function launchLines(input?: t.PiCli.LaunchIdentity): readonly string[] {
  const source = input ? input.upstreamExplicit ? 'explicit' : 'dependency/fallback' : 'unknown';
  return [
    '## Launcher Input Snapshot',
    `- observation: ${input?.stage ?? 'unknown'}`,
    `- resolved at: ${input?.resolvedAt ?? 'unknown'}`,
    `- upstream selection: ${input?.upstream ?? 'unknown'}`,
    `- upstream selection source: ${source}`,
    `- profile: ${input?.profile ?? 'unknown'}`,
    `- system prompt: ${input?.system ?? 'unknown'}`,
    `- selected tools: ${input?.tools ? input.tools.join(', ') || 'none' : 'unknown'}`,
    '- live tools/runtime: unknown (not observed)',
    '',
    'Not session or provider-prompt evidence; paths do not attest content identity.',
    'Preview omits extension materialization and OCR preflight; launch-input means prepared, not executed.',
    '',
    '### Instruction Contributions (launcher order)',
    ...(input?.contributions.map((item, index) => `${index + 1}. ${item}`) ?? ['- unknown']),
  ];
}

function toSummary(
  input?: t.PiCli.SandboxSummary.Scope,
  alias: Record<string, string> = {},
) {
  const items = (input?.summary ?? []).map((item) => alias[item] ?? item);
  if (items.length === 0) return '-';
  return items.join(' + ');
}

function toContextSummary(input?: t.PiCli.SandboxSummary['context']) {
  return (input?.include?.length ?? 0) > 0 ? 'loaded context (wrapper-owned prompt)' : '-';
}

function toCapabilityList(permissions: t.PiCli.PermissionMode, items: readonly string[]) {
  if (permissions === 'allow-all') return ['- all (Deno --allow-all)'];
  return toList(items);
}

function toList(items: readonly string[]) {
  if (items.length === 0) return ['- none'];
  return items.map((item) => `- ${item}`);
}
