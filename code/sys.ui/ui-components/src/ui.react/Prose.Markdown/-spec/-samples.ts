import { Is, Markdown, Str, type t } from './common.ts';

export type SampleKind = typeof sampleKinds[number];
export type SampleItem = {
  readonly label: string;
  readonly value?: t.Markdown.Value;
};

export const sampleKinds = ['intro', 'ast', 'lists', 'inline', 'chip', 'html', 'empty'] as const;

const AST_SOURCE = Str.dedent(`
  This sample is an MDAST object parsed by \`@sys/markdown\` before it reaches the renderer.

  - The debug state stores \`t.Markdown.Value\`.
  - Strings and ASTs use the same \`Prose.Markdown.UI\` value prop.
`);

const SAMPLES = {
  intro: {
    label: 'sample: intro',
    value: Str.dedent(`
      Use \`inline code\` for compact tokens.

      - Markdown text parses through \`@sys/markdown\`.
      - Render overrides can replace \`inlineCode\` with a component.
    `),
  },
  ast: {
    label: 'sample: parsed AST',
    value: toAst(AST_SOURCE),
  },
  lists: {
    label: 'sample: lists',
    value: Str.dedent(`
      Ordered steps:

      1. Press \`Tab\`.
      2. Press \`Enter\`.

      Unordered notes:

      - preserves list text
      - keeps \`inlineCode\` semantic
    `),
  },
  inline: {
    label: 'sample: inline semantics',
    value: 'Keep **bold** and [link text](https://example.com), with `inlineCode` intact.',
  },
  chip: {
    label: 'sample: `@sys/<Chip>` override',
    value: Str.dedent(`
      This sample renders \`MyChip\` through a caller-owned \`@sys/<Chip>\` override.

      Prose.Markdown stays generic; the spec harness imports \`Chip.UI\` and passes \`renderers.inlineCode\`.
    `),
  },
  html: {
    label: 'sample: raw HTML text',
    value: 'Before <strong>raw</strong> after `token`.',
  },
  empty: {
    label: 'sample: empty',
    value: undefined,
  },
} as const satisfies Record<SampleKind, SampleItem>;

export const MarkdownSample = {
  kinds: sampleKinds,
  get,
  isKind,
  resolveKind,
  value,
} as const;

function get<K extends SampleKind>(kind: K): (typeof SAMPLES)[K] {
  return SAMPLES[kind];
}

function isKind(input: unknown): input is SampleKind {
  return Is.string(input) && sampleKinds.some((kind) => kind === input);
}

function resolveKind(input: unknown, fallback: SampleKind = 'intro'): SampleKind {
  return isKind(input) ? input : fallback;
}

function value<K extends SampleKind>(kind: K): (typeof SAMPLES)[K]['value'] {
  return get(kind).value;
}

function toAst(source: t.StringMarkdown): t.Markdown.Ast {
  const res = Markdown.parse(source);
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
