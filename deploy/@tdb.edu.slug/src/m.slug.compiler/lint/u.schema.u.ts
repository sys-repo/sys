export function formatRootSpacing(input: string): string {
  const lines = input.split('\n');
  const out: string[] = [];
  let sawRoot = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const isRootKey =
      trimmed.length > 0 &&
      !line.startsWith(' ') &&
      !trimmed.startsWith('-') &&
      trimmed.includes(':');
    if (isRootKey) {
      if (sawRoot && out[out.length - 1] !== '') out.push('');
      sawRoot = true;
    }
    out.push(line);
  }
  return out.join('\n');
}

export function formatInlineInclude(input: string): string {
  const lines = input.split('\n');
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() !== 'include:' || i + 1 >= lines.length) {
      out.push(line);
      continue;
    }
    const next = lines[i + 1];
    const match = next.match(/^\s*-\s*(.+)\s*$/);
    if (!match) {
      out.push(line);
      continue;
    }
    const value = match[1];
    const indent = line.match(/^\s*/)?.[0] ?? '';
    out.push(`${indent}include: [${value}]`);
    i += 1;
  }
  return out.join('\n');
}
