import { Str, type t } from './common.ts';

type Sample = { label: string; markdown: string; kind: t.Admonition.Kind };

export const samples = {
  titled: {
    label: 'Titled',
    kind: 'tip',
    markdown: Str.dedent(`
      # Lorem ipsum

      Lorem ipsum dolor sit amet, \`consectetur\` adipiscing elit. Sed do
      [eiusmod tempor](https://example.com/#tempor) incididunt ut labore et
      [dolore magna](https://example.com/#dolore) aliqua.
    `),
  },
  plain: {
    label: 'Plain',
    kind: 'note',
    markdown: 'Lorem `ipsum` dolor [sit amet](https://example.com/#amet).',
  },
  expanded: {
    label: 'Expanded',
    kind: 'important',
    markdown: Str.dedent(`
      # Lorem ipsum dolor

      Sed ut \`perspiciatis\` unde *omnis iste natus* error sit voluptatem.

      ## Dolor sit amet

      - Ut enim ad **minim veniam**, quis nostrud exercitation ullamco laboris nisi ut aliquip.
      - Duis aute [irure dolor](https://example.com/#dolor) in reprehenderit.
    `),
  },
} as const satisfies Record<string, Sample>;

export type SampleId = keyof typeof samples;
