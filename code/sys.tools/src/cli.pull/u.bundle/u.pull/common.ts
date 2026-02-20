import { type t, Err, Fs } from '../../common.ts';

export function done(data: t.PullToolBundleResult): t.PullToolRemoteBundleResult {
  return { ok: true, data };
}

export function fail(error: string): t.PullToolRemoteBundleResult {
  return { ok: false, error };
}

export async function clearTargetDir(args: {
  baseDir: t.StringDir;
  targetDir: t.StringDir;
}): Promise<void> {
  const base = Fs.Path.resolve(args.baseDir);
  const target = Fs.Path.resolve(args.targetDir);

  const rel = Fs.Path.relative(base, target).replaceAll('\\', '/');
  const isInside = rel.length > 0 && rel !== '.' && rel !== '..' && !rel.startsWith('../');
  if (!isInside) {
    throw new Error(`Refusing to clear outside pull base: ${target}`);
  }

  if (await Fs.exists(target)) {
    await Fs.remove(target, { log: false });
  }
}

export function errorMessage(error: unknown): string {
  if (Err.Is.error(error)) return String(error.message ?? '').trim() || 'Bundle pull failed';
  return String(error ?? '').trim() || 'Bundle pull failed';
}

export function githubTokenHelpText() {
  return [
    'Required permissions:',
    '- Fine-grained PAT: repository access + Contents: Read',
    '- Create/manage token: https://github.com/settings/personal-access-tokens',
  ].join('\n');
}

export function mapAuthError(error: unknown): string | undefined {
  const status = normalizeErrorStatus(error);
  const message = normalizeErrorMessage(error);
  const lower = message.toLowerCase();

  if (status === 401 || status === 403) {
    return [
      'GitHub release access denied.',
      'Set GH_TOKEN (or GITHUB_TOKEN) with private-repo read permissions.',
      githubTokenHelpText(),
    ].join('\n');
  }

  // GitHub often returns 404 for private repos without sufficient auth.
  if (status === 404 && (lower.includes('not found') || lower.includes('releases') || lower.includes('asset'))) {
    return [
      'GitHub release repository/asset not accessible.',
      'Verify repo path and GH_TOKEN/GITHUB_TOKEN permissions.',
      githubTokenHelpText(),
    ].join('\n');
  }

  if (message.includes('401') || message.includes('403') || lower.includes('forbidden')) {
    return [
      'GitHub release access denied.',
      'Set GH_TOKEN (or GITHUB_TOKEN) with private-repo read permissions.',
      githubTokenHelpText(),
    ].join('\n');
  }

  return;
}

function normalizeErrorMessage(error: unknown): string {
  if (Err.Is.error(error)) return String(error.message ?? '').trim();
  return String(error ?? '').trim();
}

function normalizeErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}
