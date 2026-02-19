import { type t, Err, Fs, Process } from '../common.ts';

export function assertSafeDistPath(path: t.StringPath): t.StringPath {
  const value = String(path ?? '').trim();
  if (!value) throw new Error('dist path cannot be empty');
  if (value.startsWith('/')) throw new Error(`dist path must be relative: ${value}`);
  const normalized = value.replaceAll('\\', '/');
  if (normalized.split('/').some((part) => part === '..')) {
    throw new Error(`dist path cannot contain "..": ${value}`);
  }
  return normalized as t.StringPath;
}

export async function extractArchive(args: {
  archivePath: t.StringPath;
  outputDir: t.StringDir;
}): Promise<void> {
  const archive = args.archivePath;
  const out = args.outputDir;
  await Fs.ensureDir(out);

  const lower = archive.toLowerCase();
  const qArchive = JSON.stringify(archive);
  const qOut = JSON.stringify(out);

  const run = async (cmd: string, ctx: string) => {
    const res = await Process.run(cmd, { silent: true });
    if (!res.success) {
      const why = res.text.stderr.trim() || res.text.stdout.trim() || 'command failed';
      throw new Error(`${ctx}: ${why}`);
    }
  };

  if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
    await run(`tar -xzf ${qArchive} -C ${qOut}`, 'failed to extract tar archive');
    return;
  }

  if (lower.endsWith('.zip')) {
    await run(`unzip -qq -o ${qArchive} -d ${qOut}`, 'failed to extract zip archive');
    return;
  }

  throw new Error(`Unsupported release asset archive: ${Fs.basename(archive)}`);
}

export async function resolveDistFile(args: {
  extractedDir: t.StringDir;
  distPath: t.StringPath;
}): Promise<t.StringPath> {
  const distPath = assertSafeDistPath(args.distPath);
  const root = args.extractedDir;

  // Fast-path for exact in-root location.
  const direct = Fs.join(root, distPath);
  if (await Fs.exists(direct)) return direct;

  const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');
  const suffix = `/${trimLeadingSlash(distPath)}`;
  const hits: string[] = [];
  for await (const entry of Fs.walk(root, { includeDirs: false })) {
    if (!entry.isFile) continue;
    const rel = trimLeadingSlash(entry.path.slice(root.length).replaceAll('\\', '/'));
    if (rel === distPath || rel.endsWith(suffix)) hits.push(entry.path);
  }

  if (hits.length === 1) return hits[0] as t.StringPath;
  if (hits.length > 1) {
    throw new Error(`dist file is ambiguous within release asset: ${distPath}`);
  }

  throw new Error(`dist file not found in release asset: ${distPath}`);
}

export function mapAuthError(error: unknown): string | undefined {
  const message = normalizeErrorMessage(error);
  if (!message) return;

  if (message.includes('401') || message.includes('403') || message.toLowerCase().includes('forbidden')) {
    return [
      'GitHub release access denied.',
      'Set GH_TOKEN (or GITHUB_TOKEN) with private-repo read permissions.',
    ].join('\n');
  }

  return;
}

function normalizeErrorMessage(error: unknown): string {
  if (Err.Is.error(error)) return String(error.message ?? '').trim();
  return String(error ?? '').trim();
}
