/**
 * @module
 * A readout for displaying status and inspecting events.
 */
import type { t } from './common.ts';
import { EventView as UI } from './ui.tsx';

export const EventView: t.EventView.Lib = Object.freeze({ UI });
