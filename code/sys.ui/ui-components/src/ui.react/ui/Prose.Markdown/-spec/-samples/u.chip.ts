import { Obj, Str, type t } from '../common.ts';

const SPEC_NS = {
  anchor: 'sys.ui.component: Anchor',
  chip: 'sys.ui.component: Chip',
} as const;

const SPEC_HREF = {
  anchor: toDevHref(SPEC_NS.anchor),
  chip: toDevHref(SPEC_NS.chip),
} as const;

export const chip = {
  label: 'sample: `@sys/<Chip>` + `<Anchor>` overrides',
  value: Str.dedent(`
    This sample renders \`MyChip\` through caller-owned \`Chip.UI\` and [Anchor.UI](${SPEC_HREF.anchor}) through caller-owned \`Anchor.UI\`.

    - [\`Chip.UI\`](${SPEC_HREF.chip})
    - [Anchor.UI](${SPEC_HREF.anchor})

    Prose.Markdown stays generic; the spec harness imports both primitives and passes \`renderers.inlineCode\` plus \`renderers.link\`.
  `),
} as const;

function toDevHref(namespace: string): t.StringUri {
  return `/?dev=${Obj.hash(namespace)}`;
}
