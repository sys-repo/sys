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
