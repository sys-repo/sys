export function mergeGitignore(text: string, entries: readonly string[]) {
  const existing = new Set(gitignoreLines(text));
  const missing = entries.filter((entry) => !existing.has(entry));
  if (missing.length === 0) return text;
  return appendLines(text, missing);
}

function appendLines(text: string, lines: readonly string[]) {
  if (text.trim().length === 0) return `${lines.join('\n')}\n`;

  const separator = text.endsWith('\n') ? '' : '\n';
  return `${text}${separator}${lines.join('\n')}\n`;
}

function gitignoreLines(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}
