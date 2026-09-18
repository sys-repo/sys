import { Is, Str, type t } from './common.ts';

export type SampleKind = typeof sampleKinds[number];
export type SampleItem = {
  readonly label: string;
  readonly value: t.StringMarkdown;
};

const sampleKinds = ['workflow', 'review'] as const;
const defaultKind: SampleKind = 'workflow';
const samples = {
  workflow: {
    label: 'sample: workflow',
    value: Str.dedent(`
      ### Example workflow

      Use \`Apply\` to update the preview, or open the [reference guide](https://example.com/docs) for more detail.

      1. Select an item to inspect.
      2. Adjust one setting at a time.
      3. Review the result before continuing.

      Changes remain in the preview until you confirm them.
    `),
  },
  review: {
    label: 'sample: review checklist',
    value: Str.dedent(`
      ### Review checklist

      Open \`Details\` to inspect the current selection and compare it with the [reference guide](https://example.com/review).

      - Keep supporting notes with the review.
      - [x] Confirm the source is current.
      - [ ] Resolve any highlighted differences.
      - [ ] Record the outcome for the next review.

      The item is ready when each check has a clear result.
    `),
  },
} as const satisfies Record<SampleKind, SampleItem>;

export const Sample = {
  kinds: sampleKinds,
  defaultKind,
  get,
  isKind,
  resolveKind,
  value,
} as const;

function get<K extends SampleKind>(kind: K): (typeof samples)[K] {
  return samples[kind];
}

function isKind(input: unknown): input is SampleKind {
  return Is.string(input) && sampleKinds.some((kind) => kind === input);
}

function resolveKind(input: unknown, fallback: SampleKind = defaultKind): SampleKind {
  return isKind(input) ? input : fallback;
}

function value<K extends SampleKind>(kind: K): (typeof samples)[K]['value'] {
  return get(kind).value;
}
