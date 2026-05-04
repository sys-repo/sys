import { Fs, Update, type t } from './common.ts';

const REQUIRED = ['.pi/'] as const;
const GITIGNORE = '.gitignore' as const;

export async function ensureGitignore(cwd: t.StringDir): Promise<void> {
  const path = Fs.join(cwd, GITIGNORE) as t.StringPath;
  if (!(await Fs.exists(path))) return;

  const read = await Fs.readText(path);
  if (!read.ok) throw read.error;

  const text = read.data ?? '';
  const updated = mergeGitignore(text);
  if (updated === text) return;
  await Fs.write(path, updated);
}

export async function bootstrapGitignore(cwd: t.StringDir): Promise<void> {
  const path = Fs.join(cwd, GITIGNORE) as t.StringPath;
  if (!(await Fs.exists(path))) {
    await Fs.write(path, `${REQUIRED.join('\n')}\n`);
    return;
  }

  await ensureGitignore(cwd);
}

/**
 * Helpers:
 */
function mergeGitignore(text: string) {
  const existing = new Set(normalizeLines(text));
  const missing = REQUIRED.filter((line) => !existing.has(normalizeEntry(line)));
  if (missing.length === 0) return text;
  return appendLines(text, missing);
}

function appendLines(text: string, lines: readonly string[]) {
  if (text.trim().length === 0) return `${lines.join('\n')}\n`;

  const update = Update.lines(text, (line) => {
    if (!line.is.last) return;
    const position = line.text.length === 0 ? 'before' : 'after';
    for (const item of lines) {
      line.insert(item, position);
    }
  });
  return update.after;
}

function normalizeLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map(normalizeEntry);
}

function normalizeEntry(line: string) {
  return line.endsWith('/') ? line : `${line}/`;
}
