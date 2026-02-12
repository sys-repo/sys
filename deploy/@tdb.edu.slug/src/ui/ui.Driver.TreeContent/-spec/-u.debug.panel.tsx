import React from 'react';
import { Debug as CoreDebug, type DebugSignals } from './-SPEC.Debug.tsx';
import { type t, Tabs } from './common.ts';

type TabsProps = React.ComponentProps<typeof Tabs.UI>;
type TabItem = NonNullable<TabsProps['items']>[number];

export type HeadDebugTab = {
  readonly id: TabItem['id'];
  readonly label: NonNullable<TabItem['label']>;
  readonly render: TabItem['render'];
};

export type MakeDebugPanelArgs = {
  readonly debug: DebugSignals;
  readonly headTab: HeadDebugTab;
  readonly defaultSelected?: t.StringId;
  readonly parts?: TabsProps['parts'];
};

/**
 * Create a tabbed debug panel composed from:
 * - shared TreeContent base debug panel
 * - one head-specific panel.
 */
export function makeDebugPanel(args: MakeDebugPanelArgs): t.FC {
  const { debug, headTab } = args;
  const defaultSelected = wrangle.defaultSelected(args.defaultSelected, headTab.id);
  const parts = wrangle.parts(args.parts);

  const panel: t.FC = () => {
    const p = debug.props;
    const [tab, setTab] = React.useState<t.StringId>(defaultSelected);
    const items = wrangle.items(debug, headTab);

    return (
      <Tabs.UI
        theme={p.theme.value}
        debug={p.debug.value}
        items={items}
        value={tab}
        parts={parts}
        onChange={(e) => setTab(e.id)}
      />
    );
  };

  return panel;
}

const wrangle = {
  defaultSelected(input: t.StringId | undefined, headId: t.StringId) {
    if (input === 'base' || input === headId) return input;
    return 'base' as const;
  },

  items(debug: DebugSignals, headTab: HeadDebugTab): readonly TabItem[] {
    return [
      {
        id: 'base',
        label: 'Base: TreeContent',
        render: () => <CoreDebug debug={debug} />,
      },
      headTab,
    ];
  },

  parts(input: TabsProps['parts']): TabsProps['parts'] {
    const defaults = {
      tab: { fontSize: 12 },
      body: { padding: 15, scroll: true },
    } as const;

    if (!input) return defaults;
    return {
      ...defaults,
      ...input,
      tab: { ...defaults.tab, ...(input.tab ?? {}) },
      body: { ...defaults.body, ...(input.body ?? {}) },
    };
  },
} as const;
