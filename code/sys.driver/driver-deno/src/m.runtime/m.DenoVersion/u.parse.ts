import { Semver, stripAnsi, type t } from './common.ts';

const Regex = {
  version: /^deno\s+([^\s]+)\s*(?:\(|$)/m,
  current: /^Current Deno version:\s+([^\s]+)\s*$/m,
  latestFound: /^Found latest(?: .+)? version\s+([^\s]+)\s*$/m,
  mostRecent: /^Local deno version\s+([^\s]+)\s+is the most recent release\s*$/m,
  upgrading: /^Deno is upgrading to version\s+([^\s]+)\s*$/m,
  download: /\/v(\d+\.\d+\.\d+(?:[-+][^\s/]+)?)\//m,
} as const;

export function parseCurrentVersion(
  output: Pick<t.DenoVersion.Output, 'text'>,
): t.StringSemver | undefined {
  const text = normalizeText(output);
  return matchVersion(text, Regex.version, Regex.current);
}

export function parseUpgradeStatus(
  output: t.DenoVersion.Output,
): t.DenoVersion.Upgrade.Status | undefined {
  const text = normalizeText(output);
  const current = parseCurrentVersion(output);
  if (!current) return undefined;

  const mostRecent = matchVersion(text, Regex.mostRecent);
  if (mostRecent) {
    return {
      current,
      latest: mostRecent,
      needed: false,
      source: 'deno-upgrade-dry-run',
      output,
    };
  }

  const latest = matchVersion(text, Regex.latestFound, Regex.upgrading, Regex.download);
  if (!latest) return undefined;

  return {
    current,
    latest,
    needed: !Semver.Is.eql(current, latest),
    source: 'deno-upgrade-dry-run',
    output,
  };
}

export function parseUpgradeRun(
  output: t.DenoVersion.Output,
  options: { dryRun: boolean },
): t.DenoVersion.Upgrade.Run {
  const text = normalizeText(output);
  const from = parseCurrentVersion(output);
  const to = matchVersion(text, Regex.upgrading, Regex.latestFound, Regex.mostRecent, Regex.download) ?? from;

  return {
    from,
    to,
    success: output.success,
    dryRun: options.dryRun,
    output,
  };
}

function matchVersion(text: string, ...patterns: readonly RegExp[]): t.StringSemver | undefined {
  for (const pattern of patterns) {
    const match = pattern.exec(text)?.[1];
    const version = asSemver(match);
    if (version) return version;
  }
  return undefined;
}

function asSemver(input?: string): t.StringSemver | undefined {
  const value = input?.trim();
  if (!value) return undefined;
  const { version, error } = Semver.coerce(value.replace(/^v/, ''));
  return error ? undefined : version;
}

function normalizeText(output: Pick<t.DenoVersion.Output, 'text'>) {
  const text = [output.text.stdout, output.text.stderr]
    .filter(Boolean)
    .join('\n');
  return stripAnsi(text).replace(/\r\n?/g, '\n').trim();
}
