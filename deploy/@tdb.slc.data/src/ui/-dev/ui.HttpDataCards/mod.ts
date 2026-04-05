/**
 * @module
 */
import type { t } from './common.ts';
import { HttpDataCards as UI } from './ui.tsx';
import { createPanel } from './u.panel.tsx';
import { createSignals } from './u.signals.ts';
import { TreeContent } from './-spec.cards/-ui.tree+file-content.tsx';

export const HttpDataCards: t.HttpDataCards.Lib = {
  UI,
  createPanel,
  createSignals,
  Card: { TreeContent },
};
