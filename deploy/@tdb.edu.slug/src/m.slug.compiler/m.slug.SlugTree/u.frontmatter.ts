import { type t, Is, Yaml } from './common.ts';
import { normalizeCrdtRef } from './u.ref.ts';

type FrontmatterParse = {
  readonly has: boolean;
  readonly frontmatter: string;
  readonly rest: string;
};

type FrontmatterEnsure = {
  readonly ref: t.StringRef;
  readonly updated: boolean;
  readonly text: string;
};

const FRONT_DELIM = '---';

export async function ensureFrontmatterRef(args: {
  text: string;
  createCrdt: () => Promise<t.StringRef>;
}): Promise<FrontmatterEnsure> {
  const parsed = parseFrontmatter(args.text);
  const existing = parsed.has ? readRef(parsed.frontmatter) : undefined;
  if (existing) return { ref: existing, updated: false, text: args.text };

  const ref = normalizeCrdtRef(await args.createCrdt());
  if (parsed.has) {
    const updated = writeFrontmatter(parsed, ref);
    return { ref, updated: true, text: updated };
  }

  const inserted = insertFrontmatter(args.text, ref);
  return { ref, updated: true, text: inserted };
}

function parseFrontmatter(text: string): FrontmatterParse {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== FRONT_DELIM) {
    return { has: false, frontmatter: '', rest: text };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === FRONT_DELIM) {
      end = i;
      break;
    }
  }

  if (end === -1) {
    throw new Error('Front-matter start found without closing delimiter.');
  }

  const frontmatter = lines.slice(1, end).join('\n');
  const rest = lines.slice(end + 1).join('\n');
  return { has: true, frontmatter, rest };
}

function readRef(frontmatter: string): t.StringRef | undefined {
  if (!frontmatter.trim()) return;
  const parsed = Yaml.parse<Record<string, unknown>>(frontmatter).data;
  if (!Is.record(parsed)) return;
  const ref = (parsed as { ref?: unknown }).ref;
  return Is.str(ref) ? (ref as t.StringRef) : undefined;
}

function writeFrontmatter(parsed: FrontmatterParse, ref: t.StringRef): string {
  const body = parsed.frontmatter.length > 0 ? parsed.frontmatter : '';
  const nextFrontmatter = body.length > 0 ? `ref: ${ref}\n${body}` : `ref: ${ref}`;
  const rest = parsed.rest.length > 0 ? `\n${parsed.rest}` : '';
  return `${FRONT_DELIM}\n${nextFrontmatter}\n${FRONT_DELIM}${rest}`;
}

function insertFrontmatter(text: string, ref: t.StringRef): string {
  const needsSpacer = text.length > 0 && !/^\r?\n/.test(text);
  const spacer = needsSpacer ? '\n' : '';
  return `${FRONT_DELIM}\nref: ${ref}\n${FRONT_DELIM}\n${spacer}${text}`;
}
