import { Fs } from '@sys/fs';

export type Header = {
  file: string;
  path: { repo: string; module: string };
  module: string; // "name@version" or "Unnamed@0"
  sha256: string;
  bytes: number;
  modified: string; // ISO string in Z
  lang: string; // "ts" | "tsx" | "js" | "json" | ...
  toString(): string;
};

export async function makeHeader(
  pathAbs: string,
  repoRootAbs: string | undefined,
  denofile?: { file: { name?: string; version?: string }; dir: string },
): Promise<Header> {
  const basename = Fs.basename(pathAbs);
  const repoRel = relPath(repoRootAbs, pathAbs);
  const moduleRel = denofile ? relPath(denofile.dir, pathAbs) : basename;
  const modId = denofile
    ? `${denofile.file.name ?? 'Unnamed'}@${denofile.file.version ?? '0'}`
    : 'Unnamed@0';

  const stat = await Deno.stat(pathAbs);
  const text = (await Fs.readText(pathAbs)).data ?? '';
  const sha256 = await hashSha256(text);
  const bytes = stat.size ?? text.length;
  const modified = stat.mtime?.toISOString() ?? new Date().toISOString();
  const lang = inferLang(basename);

  const hr = '# ' + '─'.repeat(77);

  const header: Header = {
    file: basename,
    path: { repo: repoRel, module: moduleRel },
    module: modId,
    sha256,
    bytes,
    modified,
    lang,
    toString: () =>
      [
        hr,
        `# file:        ${basename}`,
        `# path.repo:   ${repoRel}`,
        `# path.module: ${moduleRel}`,
        `# module:      ${modId}`,
        `# sha256:      ${sha256} (${bytes} bytes)`,
        `# modified:    ${modified}`,
        `# lang:        ${lang}`,
        hr,
        '',
      ].join('\n'),
  };

  return header;
}

/**
 * Helpers:
 */
const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hashSha256(text: string) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

function inferLang(file: string) {
  const ext = Fs.extname(file).replace(/^\./, '').toLowerCase();
  return ext || 'txt';
}

function relPath(from: string | undefined, to: string): string {
  if (!from) return to.replaceAll('\\', '/');
  return Fs.Path.relative(from, to).replaceAll('\\', '/');
}
