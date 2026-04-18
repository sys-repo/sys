/**
 * @module
 * Dev cards for probing staged data over HTTP.
 */
import type { t } from './common.ts';
import { HttpDataCards as UI } from './ui.tsx';
import { createPanel } from './u.panel.tsx';
import { createSignals } from './u.signals.ts';
import { TreeContent } from './-spec.cards/-ui.tree+file-content.tsx';
import { TreePlayback } from './-spec.cards/-ui.tree+playback.tsx';

export const HttpDataCards: t.HttpDataCards.Lib = {
  UI,
  createPanel,
  createSignals,
  Spec: {
    load: () => import('./-spec/-SPEC.tsx').then((m) => ({ createSpec: m.createSpec })),
  },
  Card: { TreeContent, TreePlayback },
};
