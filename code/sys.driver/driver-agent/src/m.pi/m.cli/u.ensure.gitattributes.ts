import { Fs, Str, type t } from './common.ts';

const GITATTRIBUTES = '.gitattributes' as const;
const MEDIA_LFS_LINES = [
  '*.png filter=lfs diff=lfs merge=lfs -text',
  '*.jpg filter=lfs diff=lfs merge=lfs -text',
  '*.jpeg filter=lfs diff=lfs merge=lfs -text',
  '*.gif filter=lfs diff=lfs merge=lfs -text',
  '*.webp filter=lfs diff=lfs merge=lfs -text',
  '*.mp4 filter=lfs diff=lfs merge=lfs -text',
  '*.webm filter=lfs diff=lfs merge=lfs -text',
  '*.mov filter=lfs diff=lfs merge=lfs -text',
] as const;
const CANONICAL = `${
  Str.dedent(`
  # Enforce consistent line endings
  * text=auto

  # Track common large binary assets with Git LFS:
  *.png filter=lfs diff=lfs merge=lfs -text
  *.jpg filter=lfs diff=lfs merge=lfs -text
  *.jpeg filter=lfs diff=lfs merge=lfs -text
  *.gif filter=lfs diff=lfs merge=lfs -text
  *.webp filter=lfs diff=lfs merge=lfs -text
  *.mp4 filter=lfs diff=lfs merge=lfs -text
  *.webm filter=lfs diff=lfs merge=lfs -text
  *.mov filter=lfs diff=lfs merge=lfs -text
`).trim()
}
`;

export async function ensureGitattributes(cwd: t.StringDir): Promise<void> {
  const path = Fs.join(cwd, GITATTRIBUTES) as t.StringPath;
  if (!(await Fs.exists(path))) return;

  const read = await Fs.readText(path);
  if (!read.ok) throw read.error;

  const text = read.data ?? '';
  const updated = mergeGitattributes(text);
  if (updated === text) return;
  await Fs.write(path, updated);
}

export async function bootstrapGitattributes(cwd: t.StringDir): Promise<void> {
  const path = Fs.join(cwd, GITATTRIBUTES) as t.StringPath;
  if (!(await Fs.exists(path))) {
    await Fs.write(path, CANONICAL);
    return;
  }

  await ensureGitattributes(cwd);
}

function mergeGitattributes(text: string) {
  const existing = new Set(normalizeLines(text));
  const missing = MEDIA_LFS_LINES.filter((line) => !existing.has(line));
  if (missing.length === 0) return text;
  return appendLines(text, missing);
}

function appendLines(text: string, lines: readonly string[]) {
  if (text.trim().length === 0) return `${lines.join('\n')}\n`;
  const separator = text.endsWith('\n') ? '' : '\n';
  return `${text}${separator}${lines.join('\n')}\n`;
}

function normalizeLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
