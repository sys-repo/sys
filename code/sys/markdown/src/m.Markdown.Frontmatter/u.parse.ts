import {
  Err,
  Is,
  mdastFromMarkdown,
  mdastFrontmatterFromMarkdown,
  micromarkFrontmatter,
  type t,
  Yaml,
} from './common.ts';
import { parse as parseMarkdown } from '../m.Markdown/u/u.parse.ts';

const YAML_FENCE_RX = /^---[ \t]*$/;

type ExtractedFrontmatterResult =
  | { readonly error?: undefined; readonly data?: ExtractedFrontmatter }
  | { readonly error: t.StdError; readonly data?: undefined };

type ExtractedFrontmatter = {
  readonly raw: t.StringYaml;
  readonly markdown: t.StringMarkdown;
};

export const parse: t.MarkdownFrontmatter.Lib['parse'] = <T>(src = '', options = {}) => {
  try {
    const source = src ?? '';
    const extracted = extractYamlFrontmatter(source);
    if (extracted.error) return fail<T>(extracted.error);

    if (!extracted.data) return parseBody<T>(source, undefined, options);

    const yaml = Yaml.parse<T>(extracted.data.raw);
    if (yaml.error) return fail<T>(yaml.error);

    const frontmatter: t.MarkdownFrontmatter.Block<T> = {
      format: 'yaml',
      raw: extracted.data.raw,
      data: yaml.data,
    };

    return parseBody<T>(extracted.data.markdown, frontmatter, options);
  } catch (cause) {
    return fail<T>(cause);
  }
};

function extractYamlFrontmatter(src: t.StringMarkdown): ExtractedFrontmatterResult {
  if (!startsWithYamlFence(src)) return {};

  const ast = mdastFromMarkdown(src, {
    extensions: [micromarkFrontmatter(['yaml'])],
    mdastExtensions: [mdastFrontmatterFromMarkdown(['yaml'])],
  });

  const node = ast.children[0];
  if (node?.type !== 'yaml') return { error: Err.std('Unclosed YAML frontmatter.') };

  const offset = node.position?.end.offset;
  if (!Is.number(offset)) {
    return { error: Err.std('YAML frontmatter is missing source offsets.') };
  }

  const markdown = stripLeadingEol(src.slice(offset)) as t.StringMarkdown;
  return { data: { raw: node.value as t.StringYaml, markdown } };
}

function parseBody<T>(
  markdown: t.StringMarkdown,
  frontmatter: t.MarkdownFrontmatter.Block<T> | undefined,
  options: t.MarkdownFrontmatter.ParseOptions,
): t.MarkdownFrontmatter.ParseResult<T> {
  const ast = parseMarkdown(markdown, { flavor: options.flavor });
  if (ast.error) return fail<T>(ast.error);

  const data: t.MarkdownFrontmatter.Document<T> = frontmatter
    ? { frontmatter, markdown, ast: ast.data }
    : { markdown, ast: ast.data };

  return { data };
}

function startsWithYamlFence(src: string) {
  const eol = firstEolIndex(src);
  const line = eol < 0 ? src : src.slice(0, eol);
  return YAML_FENCE_RX.test(line);
}

function firstEolIndex(src: string) {
  const n = src.indexOf('\n');
  const r = src.indexOf('\r');
  if (n < 0) return r;
  if (r < 0) return n;
  return Math.min(n, r);
}

function stripLeadingEol(src: string) {
  if (src.startsWith('\r\n')) return src.slice(2);
  if (src.startsWith('\n')) return src.slice(1);
  if (src.startsWith('\r')) return src.slice(1);
  return src;
}

function fail<T>(cause: unknown): t.MarkdownFrontmatter.ParseResult<T> {
  return { error: Err.std('Failed to parse Markdown frontmatter', { cause }) };
}
