import { Is, Markdown, Obj, Str, type t } from './common.ts';
import { THEMATIC_BREAK_SOURCE } from './-sample.thematic-breaks.ts';

export type SampleKind = typeof sampleKinds[number];
export type SampleViewport = 'center' | 'scroll';
export type SampleItem = {
  readonly label: string;
  readonly value?: t.Markdown.Value;
  readonly viewport?: SampleViewport;
};

export const sampleKinds = [
  'intro',
  'ast',
  'headings',
  'thematic-breaks',
  'lists',
  'task-state',
  'inline',
  'chip',
  'html',
  'empty',
] as const;

const AST_SOURCE = Str.dedent(`
  This sample is an MDAST object parsed by \`@sys/markdown\` before it reaches the renderer.

  - The debug state stores \`t.Markdown.Value\`.
  - Strings and ASTs use the same \`Prose.Markdown.UI\` value prop.
`);

const SPEC_NS = {
  anchor: 'sys.ui.component: Anchor',
  chip: 'sys.ui.component: Chip',
} as const;

const SPEC_HREF = {
  anchor: toDevHref(SPEC_NS.anchor),
  chip: toDevHref(SPEC_NS.chip),
} as const;

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
  headings: {
    label: 'sample: headings',
    value: Str.dedent(`
      # Heading level 1

      ## Heading level 2

      ### Heading level 3

      #### Heading level 4

      ##### Heading level 5

      ###### Heading level 6
    `),
  },
  'thematic-breaks': {
    label: 'sample: thematic-break source DSL',
    viewport: 'scroll',
    value: THEMATIC_BREAK_SOURCE,
  },
  lists: {
    label: 'sample: lists',
    value: Str.dedent(`
      Ordered steps:

      1. Press \`Tab\`.
      2. Press \`Enter\`.

      ---

      Unordered notes:

      - preserves list text
      - keeps \`inlineCode\` semantic

      ---

      Task states:

      - [x] completed task
      - [ ] pending task
    `),
  },
  'task-state': {
    label: 'sample: task-state `<Switch>` override',
    value: Str.dedent(`
      Caller-owned task-state renderer:

      - [x] completed through \`Buttons.Switch\`
      - [ ] pending through \`Buttons.Switch\`
      - [x] this deliberately longer task wraps within the prose measure so continuation lines stay aligned with the task body instead of sliding beneath the switch marker
    `),
  },
  inline: {
    label: 'sample: inline semantics',
    value: 'Keep **bold** and [link text](https://example.com), with `inlineCode` intact.',
  },
  chip: {
    label: 'sample: `@sys/<Chip>` + `<Anchor>` overrides',
    value: Str.dedent(`
      This sample renders \`MyChip\` through caller-owned \`Chip.UI\` and [Anchor.UI](${SPEC_HREF.anchor}) through caller-owned \`Anchor.UI\`.

      - [\`Chip.UI\`](${SPEC_HREF.chip})
      - [Anchor.UI](${SPEC_HREF.anchor})

      Prose.Markdown stays generic; the spec harness imports both primitives and passes \`renderers.inlineCode\` plus \`renderers.link\`.
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
  viewport,
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

function viewport(kind: SampleKind): SampleViewport {
  const sample: SampleItem = get(kind);
  return sample.viewport ?? 'center';
}

function toDevHref(namespace: string): t.StringUri {
  return `/?dev=${Obj.hash(namespace)}`;
}

function toAst(source: t.StringMarkdown): t.Markdown.Ast {
  const res = Markdown.parse(source);
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
