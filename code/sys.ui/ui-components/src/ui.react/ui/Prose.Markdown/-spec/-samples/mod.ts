import { Is, type t } from '../common.ts';
import { ast } from './u.ast.ts';
import { chip } from './u.chip.ts';
import { codeBlocks } from './u.code-blocks.ts';
import { empty } from './u.empty.ts';
import { fallbackCanary } from './u.fallback-canary.ts';
import { headings } from './u.headings.ts';
import { html } from './u.html.ts';
import { inline } from './u.inline.ts';
import { intro } from './u.intro.ts';
import { lists } from './u.lists.ts';
import { taskState } from './u.task-state.ts';
import { thematicBreaks } from './u.thematic-breaks.ts';

export { FALLBACK_CANARY_NODE_TYPE } from './u.fallback-canary.ts';

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
  'code-blocks',
  'fallback-canary',
  'thematic-breaks',
  'lists',
  'task-state',
  'inline',
  'chip',
  'html',
  'empty',
] as const;

const SAMPLES = {
  intro,
  ast,
  headings,
  'code-blocks': codeBlocks,
  'fallback-canary': fallbackCanary,
  'thematic-breaks': thematicBreaks,
  lists,
  'task-state': taskState,
  inline,
  chip,
  html,
  empty,
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
