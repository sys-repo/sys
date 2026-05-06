import { c, Str, type t } from './common.ts';

/** Format a read-only shell doctor report for CLI output. */
export function formatDoctor(report: t.ShellTool.Doctor.Report): string {
  const shellLabel = report.shell.path ?? c.gray('(unknown)');
  const dialectLabel = report.shell.dialect ?? c.gray('(unknown)');
  const supportLabel = support(report.shell.support);
  const profiles = report.profiles.length
    ? report.profiles.map(formatProfile)
    : [emptyProfilesMessage(report)];
  const warnings = report.warnings.length
    ? report.warnings.map((warning) => `  ${c.yellow('!')} ${warning}`)
    : [`  ${c.green('✓')} no blocking issues detected`];

  const out = Str.builder()
    .line(`  ${c.green('system/shell:tools')} ${c.gray('doctor')}`)
    .blank()
    .line(`  ${c.bold('shell')}`)
    .line(`    path: ${shellLabel}`)
    .line(`    dialect: ${dialectLabel}`)
    .line(`    support: ${supportLabel}`)
    .blank()
    .line(`  ${c.bold('catalog')}`)
    .line(`    aliases: ${report.catalog.aliases.map((entry) => c.cyan(entry.name)).join(', ')}`)
    .line(`    path: ${report.catalog.paths.map((entry) => c.cyan(entry.label)).join(', ')}`)
    .blank()
    .line(`  ${c.bold('environment')}`)
    .line(`    HOME: ${report.env.home ?? c.gray('(unset)')}`)
    .line(`    DENO_INSTALL: ${report.env.denoInstall ?? c.gray('(unresolved)')}`)
    .line(`    DENO bin on PATH: ${yesNo(report.env.pathContainsDenoBin)}`)
    .blank()
    .line(`  ${c.bold('profiles')}`);

  profiles.forEach((line) => out.line(line));
  out.blank().line(`  ${c.bold('diagnosis')}`);
  warnings.forEach((line) => out.line(line));

  return `${Str.trimEdgeNewlines(out.toString())}\n`;
}

/** Format the shell alias catalog and managed profile state. */
export function formatAliasList(report: t.ShellTool.Alias.ListReport): string {
  const out = Str.builder()
    .line(`  ${c.green('system/shell:tools')} ${c.gray('alias list')}`)
    .blank()
    .line(`  ${c.bold('aliases')}`);

  report.items.forEach((item) => {
    const state = aliasState(item);
    const stale = item.stale ? ` ${c.yellow('(stale managed block)')}` : '';
    out.line(`    ${c.cyan(item.entry.name)} ${state}${stale}`);
    out.line(`      ${c.gray('command:')} ${item.entry.command}`);
    if (item.conflictProfiles.length > 0) {
      out.line(`      ${c.gray('conflicts:')} ${item.conflictProfiles.join(', ')}`);
    }
  });

  out.blank().line(`  ${c.bold('profiles')}`);
  const profiles = report.profiles.length
    ? report.profiles.map(formatProfile)
    : [`  ${c.yellow('!')} no profile candidates`];
  profiles.forEach((line) => out.line(line));

  if (report.warnings.length > 0) {
    out.blank().line(`  ${c.bold('warnings')}`);
    report.warnings.forEach((warning) => out.line(`  ${c.yellow('!')} ${warning}`));
  }

  return Str.trimEdgeNewlines(out.toString());
}

/** Format a dry-run alias enable plan without leaking profile content. */
export function formatAliasEnable(report: t.ShellTool.Alias.EnableReport): string {
  const out = Str.builder()
    .line(`  ${c.green('system/shell:tools')} ${c.gray(`alias enable ${report.target}`)}`)
    .blank()
    .line(`  ${c.bold('aliases')}`);

  report.entries.forEach((entry) => {
    out.line(`    ${c.cyan(entry.name)} ${c.gray('→')} ${entry.command}`);
  });

  appendPlan(out, report.profile, report.plan);
  appendWarnings(out, report.warnings);

  return Str.trimEdgeNewlines(out.toString());
}

/** Format the shell PATH catalog and managed profile state. */
export function formatPathList(report: t.ShellTool.Path.ListReport): string {
  const out = Str.builder()
    .line(`  ${c.green('system/shell:tools')} ${c.gray('path list')}`)
    .blank()
    .line(`  ${c.bold('path')}`);

  report.items.forEach((item) => {
    const state = pathState(item);
    const stale = item.stale ? ` ${c.yellow('(stale managed block)')}` : '';
    out.line(`    ${c.cyan(item.entry.label)} ${state}${stale}`);
    out.line(`      ${c.gray('expression:')} ${item.entry.expression.split(/\r?\n/)[0] ?? ''}`);
    if (item.unmanagedProfiles.length > 0) {
      out.line(`      ${c.gray('unmanaged:')} ${item.unmanagedProfiles.join(', ')}`);
    }
  });

  out.blank().line(`  ${c.bold('environment')}`)
    .line(`    DENO_INSTALL: ${report.env.denoInstall ?? c.gray('(unresolved)')}`)
    .line(`    DENO bin on PATH: ${yesNo(report.env.pathContainsDenoBin)}`);

  out.blank().line(`  ${c.bold('profiles')}`);
  const profiles = report.profiles.length
    ? report.profiles.map(formatProfile)
    : [`  ${c.yellow('!')} no profile candidates`];
  profiles.forEach((line) => out.line(line));

  if (report.warnings.length > 0) {
    out.blank().line(`  ${c.bold('warnings')}`);
    report.warnings.forEach((warning) => out.line(`  ${c.yellow('!')} ${warning}`));
  }

  return Str.trimEdgeNewlines(out.toString());
}

/** Format a dry-run PATH add plan without leaking profile content. */
export function formatPathAdd(report: t.ShellTool.Path.AddReport): string {
  const out = Str.builder()
    .line(`  ${c.green('system/shell:tools')} ${c.gray(`path add ${report.target}`)}`)
    .blank()
    .line(`  ${c.bold('path')}`);

  report.entries.forEach((entry) => {
    out.line(`    ${c.cyan(entry.label)}`);
  });

  out.blank().line(`  ${c.bold('environment')}`)
    .line(`    DENO_INSTALL: ${report.env.denoInstall ?? c.gray('(unresolved)')}`)
    .line(`    DENO bin on PATH: ${yesNo(report.env.pathContainsDenoBin)}`);

  appendPlan(out, report.profile, report.plan);
  appendWarnings(out, report.warnings);

  return Str.trimEdgeNewlines(out.toString());
}

/**
 * Helpers:
 */
function appendPlan(
  out: ReturnType<typeof Str.builder>,
  profile: t.ShellTool.Doctor.Profile | undefined,
  plan: t.ShellTool.Alias.EnablePlan | t.ShellTool.Path.AddPlan | undefined,
): void {
  out.blank().line(`  ${c.bold('plan')}`);
  if (profile && plan) {
    out.line(`    profile: ${c.cyan(profile.path)}`);
    out.line(`    operation: ${planKind(plan)}`);
    out.blank().line(`  ${c.bold('managed block preview')}`);
    blockPreviewLines(plan.preview).forEach((line) => out.line(line));
  } else {
    out.line(`    ${c.yellow('no plan available')}`);
  }
}

function appendWarnings(out: ReturnType<typeof Str.builder>, warnings: readonly string[]): void {
  const lines = warnings.length ? warnings : ['No changes written'];
  out.blank().line(`  ${c.bold('status')}`);
  lines.forEach((warning) => out.line(`  ${c.yellow('!')} ${warning}`));
}

function blockPreviewLines(preview: string): readonly string[] {
  const lines = preview.split(/\r?\n/);
  if (lines.at(-1) === '') return lines.slice(0, -1);
  return lines;
}

function emptyProfilesMessage(report: t.ShellTool.Doctor.Report): string {
  const reason = report.env.home
    ? 'shell dialect has no write profile candidates'
    : 'HOME is not set';
  return `  ${c.yellow('!')} no profile candidates (${reason})`;
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

function planKind(plan: t.ShellTool.Alias.EnablePlan | t.ShellTool.Path.AddPlan): string {
  if (plan.kind === 'unchanged') return c.green('unchanged');
  if (plan.kind === 'add') return c.yellow('add');
  if (plan.kind === 'replace') return c.yellow('replace');
  return c.gray(plan.kind);
}

function formatProfile(profile: t.ShellTool.Doctor.Profile): string {
  const exists = profile.exists ? c.green('exists') : c.gray('missing');
  const block = formatBlock(profile.block);
  return `  ${c.cyan(profile.path)} ${c.gray(`(${profile.role})`)} ${exists}; block: ${block}`;
}

function formatBlock(block: t.ShellTool.BlockState): string {
  if (block.kind === 'missing') return c.gray('missing');
  if (block.kind === 'invalid') return c.yellow(`invalid:${block.reason}`);
  return block.stale ? c.yellow('present:stale') : c.green('present:fresh');
}

function support(value: t.ShellTool.Support): string {
  if (value === 'write') return c.green(value);
  if (value === 'doctor-only') return c.yellow(value);
  return c.gray(value);
}

function yesNo(value: boolean): string {
  return value ? c.green('yes') : c.yellow('no');
}
