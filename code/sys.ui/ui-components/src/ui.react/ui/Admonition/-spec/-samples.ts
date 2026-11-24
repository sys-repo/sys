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
  long: {
    label: 'Long',
    kind: 'note',
    markdown: Str.dedent(`
      # Nota bene, lector

      Nulla vitae elit libero, a pharetra augue.

      Aenean lacinia bibendum nulla sed consectetur. Donec id elit non mi porta
      gravida at eget metus.

      - Donec sed odio dui.
      - Cras justo odio, dapibus ac facilisis in, egestas eget quam.

      Vestibulum id ligula porta felis euismod semper.
    `),
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
  checklist: {
    label: 'Checklist',
    kind: 'caution',
    markdown: Str.dedent(`
      # Caution: nullam vitae

      - Integer posuere erat a ante.
      - Etiam porta sem malesuada magna mollis euismod.
    `),
  },
  consequence: {
    label: 'Consequence',
    kind: 'warning',
    markdown: Str.dedent(`
      # Warning: littera scripta manet

      Quod hodie scribis, cras quoque legi potest. Antequam epistulam mittas,
      verba tua iterum lege. Postea enim exemplum apud lectorem manebit.
    `),
  },
} as const satisfies Record<string, Sample>;

export type SampleId = keyof typeof samples;
