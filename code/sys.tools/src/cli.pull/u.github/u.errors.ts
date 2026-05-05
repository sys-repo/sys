import { Err, Is } from './common.ts';

type GithubErrorContext = {
  readonly kind?: 'github:release' | 'github:repo';
  readonly repo?: string;
  readonly ref?: string;
  readonly path?: string;
  readonly tag?: string;
  readonly asset?: string;
};

const GithubTokenSettingsUrl = 'https://github.com/settings/personal-access-tokens';
const GithubContentsReadPermission = 'Contents → Read-only';
const GithubTokenPermissionGuidance =
  `Set GH_TOKEN or GITHUB_TOKEN to a fine-grained PAT with this repository selected and grant ${GithubContentsReadPermission}.`;

export function githubTokenHelpText() {
  return [
    'Required token settings:',
    '- Repository access: select the target repository',
    `- Repository permissions: ${GithubContentsReadPermission}`,
    `- Token admin: ${GithubTokenSettingsUrl}`,
  ].join('\n');
}

export function mapGithubError(
  error: unknown,
  context: GithubErrorContext = {},
): string | undefined {
  const status = normalizeErrorStatus(error);
  const message = normalizeErrorMessage(error);
  const lower = message.toLowerCase();
  const detail = formatContext(context);

  if (isRateLimit(status, error, lower)) {
    return joinBlocks([
      'GitHub API rate limit reached.',
      detail,
      'Set GH_TOKEN or GITHUB_TOKEN to use authenticated GitHub API limits.',
    ]);
  }

  if (
    status === 401 ||
    status === 403 ||
    message.includes('401') ||
    message.includes('403') ||
    lower.includes('forbidden') ||
    lower.includes('bad credentials')
  ) {
    return joinBlocks([
      'GitHub access denied.',
      detail,
      GithubTokenPermissionGuidance,
      githubTokenHelpText(),
    ]);
  }

  // GitHub often returns 404 for private resources without sufficient auth.
  if (status === 404 || lower.includes('not found')) {
    return joinBlocks([
      'GitHub repository/path/ref not accessible.',
      detail,
      'The repository may not exist, the ref/path may be wrong, or GitHub may be hiding a private repository.',
      GithubTokenPermissionGuidance,
    ]);
  }

  return;
}

function formatContext(context: GithubErrorContext): string {
  const rows: string[] = [];
  if (context.kind) rows.push(`source: ${context.kind}`);
  if (context.repo) rows.push(`repo: ${context.repo}`);
  if (context.ref) rows.push(`ref: ${context.ref}`);
  if (context.path) rows.push(`path: ${context.path}`);
  if (context.tag) rows.push(`tag: ${context.tag}`);
  if (context.asset) rows.push(`asset: ${context.asset}`);
  return rows.length > 0 ? rows.join('\n') : '';
}

function joinBlocks(blocks: readonly string[]): string {
  return blocks.map((block) => block.trim()).filter(Boolean).join('\n');
}

function isRateLimit(status: number | undefined, error: unknown, lowerMessage: string): boolean {
  if (lowerMessage.includes('rate limit')) return true;
  if (status === 429) return true;
  if (status !== 403) return false;

  const remaining = headerValue(error, 'x-ratelimit-remaining');
  return remaining === '0';
}

function headerValue(error: unknown, key: string): string | undefined {
  if (!Is.record(error)) return;
  const headers =
    (error as { response?: { headers?: unknown }; headers?: unknown }).response?.headers ??
      error.headers;
  if (!Is.record(headers)) return;
  const value = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()];
  return Is.str(value) ? value : undefined;
}

function normalizeErrorMessage(error: unknown): string {
  if (Err.Is.error(error)) return String(error.message ?? '').trim();
  return String(error ?? '').trim();
}

function normalizeErrorStatus(error: unknown): number | undefined {
  if (!Is.record(error)) {
    return parseStatusFromMessage(normalizeErrorMessage(error));
  }
  const status = error.status ?? (error as { response?: { status?: unknown } }).response?.status;
  if (Is.num(status)) return status;
  return parseStatusFromMessage(normalizeErrorMessage(error));
}

function parseStatusFromMessage(message: string): number | undefined {
  const match = message.match(/\b(401|403|404|429)\b/);
  if (!match) return;
  return Number(match[1]);
}
