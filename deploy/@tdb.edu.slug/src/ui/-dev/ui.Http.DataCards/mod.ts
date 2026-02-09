/**
 * @module
 * Sample data loader cards.
 */
export * from './ui/ui.CardKindsList.tsx';

import { Descriptor } from './-spec.cards/-ui.descriptor.tsx';
import { TreeContent } from './-spec.cards/-ui.tree+content.tsx';
import { TreePlaybackAssets } from './-spec.cards/-ui.tree+playback-assets.tsx';
import { createPanel } from './u.panel.tsx';
import { createSignals } from './u.signals.ts';

export const DataCards = {
  createPanel,
  createSignals,
  Card: {
    Descriptor,
    TreeContent,
    TreePlaybackAssets,
  },
} as const;
