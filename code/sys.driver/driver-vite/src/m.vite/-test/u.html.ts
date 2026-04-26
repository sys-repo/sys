export function extractModulePreloadLinks(html: string): string[] {
  const regex = /<link\s+rel="modulepreload"\s+crossorigin\s+href="(\.\/pkg\/[^"]+)"/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}
