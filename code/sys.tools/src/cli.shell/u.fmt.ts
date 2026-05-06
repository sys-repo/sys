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

  return Str.trimEdgeNewlines(out.toString());
}

/**
 * Helpers:
 */
function emptyProfilesMessage(report: t.ShellTool.Doctor.Report): string {
  const reason = report.env.home
    ? 'shell dialect has no write profile candidates'
    : 'HOME is not set';
  return `  ${c.yellow('!')} no profile candidates (${reason})`;
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
