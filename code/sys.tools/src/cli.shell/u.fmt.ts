import { c, type t } from './common.ts';
import {
  field,
  listLabels,
  renderShellOutput,
  type Section,
  successField,
  warningLines,
} from './u.fmt.layout.ts';

/** Format a read-only shell doctor report for CLI output. */
export function formatDoctor(report: t.ShellTool.Doctor.Report): string {
  return renderShellOutput('doctor', [
    {
      label: 'shell',
      lines: [
        field('path', report.shell.path ?? c.gray('(unknown)'), 14),
        field('dialect', report.shell.dialect ?? c.gray('(unknown)'), 14),
        field('profile edits', profileEditSupport(report.shell.support), 14),
      ],
    },
    {
      label: 'baseline',
      lines: [
        field('aliases', listLabels(report.catalog.aliases.map((entry) => entry.name)), 13),
        field('PATH entries', listLabels(report.catalog.paths.map((entry) => entry.label)), 13),
      ],
    },
    {
      label: 'environment',
      lines: [
        field('HOME', report.env.home ?? c.gray('(unset)'), 17),
        field('DENO_INSTALL', report.env.denoInstall ?? c.gray('(unresolved)'), 17),
        field('Deno bin on PATH', yesNo(report.env.pathContainsDenoBin), 17),
      ],
    },
    { label: 'profiles', lines: profileLines(report.profiles, report) },
    { label: 'diagnosis', lines: warningLines(report.warnings, 'no issues detected') },
  ]);
}

/** Format the shell alias catalog and managed profile state. */
export function formatAliasList(report: t.ShellTool.Alias.ListReport): string {
  const sections: Section[] = [
    { label: 'aliases', lines: aliasListLines(report.items) },
    { label: 'profiles', lines: profileLines(report.profiles) },
  ];

  if (report.warnings.length > 0) {
    sections.push({ label: 'warnings', lines: warningLines(report.warnings) });
  }

  return renderShellOutput('alias list', sections);
}

/** Format an alias enable report without leaking profile content. */
export function formatAliasEnable(report: t.ShellTool.Alias.EnableReport): string {
  const sections: Section[] = [{
    label: 'aliases',
    lines: report.entries.map((entry) => `${c.cyan(entry.name)} ${c.gray('→')} ${entry.command}`),
  }];

  if (report.status === 'applied') {
    sections.push(...mutationAppliedSections(report));
  } else {
    sections.push(...planSections(report.profile, report.plan, report.backup));
    sections.push(statusSection(report.warnings));
  }

  return renderShellOutput(`alias enable ${report.target}`, sections);
}

/** Format the shell PATH catalog and managed profile state. */
export function formatPathList(report: t.ShellTool.Path.ListReport): string {
  const sections: Section[] = [
    { label: 'path', lines: pathListLines(report.items) },
    {
      label: 'environment',
      lines: [
        field('DENO_INSTALL', report.env.denoInstall ?? c.gray('(unresolved)'), 17),
        field('Deno bin on PATH', yesNo(report.env.pathContainsDenoBin), 17),
      ],
    },
    { label: 'profiles', lines: profileLines(report.profiles) },
  ];

  if (report.warnings.length > 0) {
    sections.push({ label: 'warnings', lines: warningLines(report.warnings) });
  }

  return renderShellOutput('path list', sections);
}

/** Format a PATH add report without leaking profile content. */
export function formatPathAdd(report: t.ShellTool.Path.AddReport): string {
  const sections: Section[] = [
    { label: 'path', lines: report.entries.map((entry) => c.cyan(entry.label)) },
    {
      label: 'environment',
      lines: [
        field('DENO_INSTALL', report.env.denoInstall ?? c.gray('(unresolved)'), 17),
        field('Deno bin on PATH', yesNo(report.env.pathContainsDenoBin), 17),
      ],
    },
  ];

  if (report.status === 'applied') {
    sections.push(...mutationAppliedSections(report));
  } else {
    sections.push(...planSections(report.profile, report.plan, report.backup));
    sections.push(statusSection(report.warnings));
  }

  return renderShellOutput(`path add ${report.target}`, sections);
}

/** Format the recommended baseline init flow without leaking profile content. */
export function formatApply(
  report: t.ShellTool.Apply.Report,
  command: 'init' | 'apply' = 'init',
): string {
  const baseline = report.aliases.map((entry) =>
    `${c.cyan(`alias ${entry.name}`)} ${c.gray('→')} ${entry.command}`
  );
  if (report.paths.length > 0) {
    baseline.push(...report.paths.map((entry) => c.cyan(`path ${entry.label}`)));
  } else {
    baseline.push(c.yellow('path Deno bin skipped'));
  }

  const sections: Section[] = [
    { label: 'baseline', lines: baseline },
    {
      label: 'environment',
      lines: [
        field('DENO_INSTALL', report.env.denoInstall ?? c.gray('(unresolved)'), 17),
        field('Deno bin on PATH', yesNo(report.env.pathContainsDenoBin), 17),
      ],
    },
  ];

  if (report.status === 'applied') {
    sections.push(...appliedSections(report));
  } else {
    sections.push(
      ...planSections(report.profile, report.plan, report.backup),
      statusSection(report.warnings),
    );
  }

  return renderShellOutput(command, sections);
}

/**
 * Helpers:
 */
type ManagedBlockPlan =
  | t.ShellTool.Alias.EnablePlan
  | t.ShellTool.Path.AddPlan
  | t.ShellTool.Apply.Plan;

function aliasListLines(items: readonly t.ShellTool.Alias.Item[]): readonly string[] {
  if (items.length === 0) return [c.gray('(none)')];

  return items.flatMap((item) => {
    const state = aliasState(item);
    const stale = item.stale ? ` ${c.yellow('(stale managed block)')}` : '';
    const lines = [
      `${c.cyan(item.entry.name)} ${state}${stale}`,
      `${c.gray('-')} ${field('command', item.entry.command, 10)}`,
    ];

    if (item.conflictProfiles.length > 0) {
      lines.push(`${c.gray('-')} ${field('conflicts', item.conflictProfiles.join(', '), 10)}`);
    }

    return lines;
  });
}

function pathListLines(items: readonly t.ShellTool.Path.Item[]): readonly string[] {
  if (items.length === 0) return [c.gray('(none)')];

  return items.flatMap((item) => {
    const state = pathState(item);
    const stale = item.stale ? ` ${c.yellow('(stale managed block)')}` : '';
    const lines = [
      `${c.cyan(item.entry.label)} ${state}${stale}`,
      `${c.gray('-')} ${field('expression', item.entry.expression.split(/\r?\n/)[0] ?? '', 11)}`,
    ];

    if (item.unmanagedProfiles.length > 0) {
      lines.push(`${c.gray('-')} ${field('manual PATH', item.unmanagedProfiles.join(', '), 11)}`);
    }

    return lines;
  });
}

function profileLines(
  profiles: readonly t.ShellTool.Doctor.Profile[],
  report?: t.ShellTool.Doctor.Report,
): readonly string[] {
  if (profiles.length > 0) return profiles.map(formatProfile);
  return [emptyProfilesMessage(report)];
}

function planSections(
  profile: t.ShellTool.Doctor.Profile | undefined,
  plan: ManagedBlockPlan | undefined,
  backup?: t.StringPath,
): readonly Section[] {
  if (!(profile && plan)) return [{ label: 'plan', lines: [c.yellow('no plan available')] }];

  const lines = [field('profile', c.cyan(profile.path), 10)];
  if (backup) lines.push(field('backup', c.cyan(backup), 10));
  lines.push(field('operation', planKind(plan), 10));

  return [
    { label: 'plan', lines },
    { label: 'preview', lines: blockPreviewLines(plan.preview) },
  ];
}

function statusSection(warnings: readonly string[]): Section {
  const lines = warnings.length ? warningLines(warnings) : [c.yellow('! No changes written')];
  return { label: 'status', lines };
}

function appliedSections(report: t.ShellTool.Apply.Report): readonly Section[] {
  return mutationAppliedSections(report);
}

function mutationAppliedSections(report: {
  readonly profile?: t.ShellTool.Doctor.Profile;
  readonly backup?: t.StringPath;
  readonly aftercare?: t.ShellTool.Aftercare;
  readonly warnings: readonly string[];
}): readonly Section[] {
  const status: string[] = [];
  if (report.profile) status.push(successField('wrote', report.profile.path, 7));
  if (report.backup) status.push(successField('backup', report.backup, 7));
  if (report.aftercare) {
    status.push(successField('next', report.aftercare.source, 7));
    status.push(successField('verify', report.aftercare.verify, 7));
  }

  const sections: Section[] = [{ label: 'status', lines: status }];
  if (report.warnings.length > 0) {
    sections.push({ label: 'notes', lines: warningLines(report.warnings) });
  }
  return sections;
}

function blockPreviewLines(preview: string): readonly string[] {
  const lines = preview.split(/\r?\n/);
  const trimmed = lines.at(-1) === '' ? lines.slice(0, -1) : lines;
  return trimmed.map((line) => line.length > 0 ? c.gray(line) : '');
}

function emptyProfilesMessage(report?: t.ShellTool.Doctor.Report): string {
  if (!report) return `${c.yellow('!')} no profile candidates`;

  const reason = report.env.home
    ? 'shell dialect has no profile edit candidates'
    : 'HOME is not set';
  return `${c.yellow('!')} no profile candidates (${reason})`;
}

function aliasState(item: t.ShellTool.Alias.Item): string {
  if (item.state === 'enabled') return c.green('enabled');
  if (item.state === 'conflict') return c.yellow('conflict');
  return c.gray('missing');
}

function pathState(item: t.ShellTool.Path.Item): string {
  if (item.state === 'enabled') return c.green('enabled');
  if (item.state === 'present') return c.yellow('present');
  return c.gray('missing');
}

function planKind(plan: ManagedBlockPlan): string {
  if (plan.kind === 'unchanged') return c.green('unchanged');
  if (plan.kind === 'add') return c.yellow('add');
  if (plan.kind === 'replace') return c.yellow('replace');
  return c.gray(plan.kind);
}

function formatProfile(profile: t.ShellTool.Doctor.Profile): string {
  const exists = profile.exists ? c.green('exists') : c.gray('missing');
  const block = formatBlock(profile.block);
  return `${c.cyan(profile.path)} ${
    c.gray(`(${profile.role})`)
  } ${exists}; managed block: ${block}`;
}

function formatBlock(block: t.ShellTool.BlockState): string {
  if (block.kind === 'missing') return c.gray('absent');
  if (block.kind === 'invalid') return c.yellow(`invalid markers (${block.reason})`);
  return block.stale ? c.yellow('manual edits') : c.green('current');
}

function profileEditSupport(value: t.ShellTool.Support): string {
  if (value === 'write') return c.green('supported');
  if (value === 'doctor-only') return c.yellow('doctor only');
  return c.gray('unsupported');
}

function yesNo(value: boolean): string {
  return value ? c.green('yes') : c.yellow('no');
}
