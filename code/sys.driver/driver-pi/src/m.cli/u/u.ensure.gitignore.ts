import { Fs, type t, TextUpdate } from '../common.ts';

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
  const write = await Fs.write(path, updated);
  if (write.error) throw write.error;
}

export async function bootstrapGitignore(cwd: t.StringDir): Promise<void> {
  const path = Fs.join(cwd, GITIGNORE) as t.StringPath;
  if (!(await Fs.exists(path))) {
    const write = await Fs.write(path, `${REQUIRED.join('\n')}\n`);
    if (write.error) throw write.error;
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

  const update = TextUpdate.lines(text, (line) => {
    if (!line.is.last) return;
    if (line.text.length === 0) return lines.map((item) => line.insertBefore(item));
    return lines.map((item) => line.insertAfter(item));
  }, { eof: 'ensure', newline: '\n' });
  if (!update.ok) throw new Error(update.error.message);
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
