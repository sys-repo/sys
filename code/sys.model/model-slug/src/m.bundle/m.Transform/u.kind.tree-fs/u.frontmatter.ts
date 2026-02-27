import { type t, Is, Yaml } from './common.ts';

type Frontmatter = Record<string, unknown>;

export function readFrontmatter(source: string, path: string): t.SlugFileContentFrontmatter {
  const frontmatter = parseFrontmatter(source);
  if (!frontmatter) throw new Error(`Missing frontmatter in slug-tree source: ${path}`);
  const ref = frontmatter.ref;
  if (!Is.str(ref) || ref.length === 0) {
    throw new Error(`Missing frontmatter ref in slug-tree source: ${path}`);
  }
  const title = frontmatter.title;
  if (title !== undefined && !Is.str(title)) {
    throw new Error(`Invalid frontmatter title in slug-tree source: ${path}`);
  }
  const normalized = {
    ...(frontmatter as Frontmatter),
    ref: ref as t.StringRef,
  };
  return title !== undefined
    ? ({ ...normalized, title } as t.SlugFileContentFrontmatter)
    : (normalized as t.SlugFileContentFrontmatter);
}

export function parseFrontmatter(source: string): Frontmatter | undefined {
  const lines = source.split(/\r?\n/);
  if (lines[0] !== '---') return;
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === '---') {
      end = i;
      break;
    }
  }
  if (end === -1) throw new Error('Front-matter start found without closing delimiter.');
  const raw = lines.slice(1, end).join('\n');
  if (!raw.trim()) return {};
  const parsed = Yaml.parse<Frontmatter>(raw).data;
  return Is.record(parsed) ? (parsed as Frontmatter) : {};
}
