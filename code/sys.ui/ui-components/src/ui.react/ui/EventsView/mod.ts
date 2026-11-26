/**
 * @module
 * A readout for displaying status and inspecting events.
 */
import type { t } from './common.ts';
import { EventsView as UI } from './ui.tsx';

export const EventsView: t.EventsView.Lib = Object.freeze({ UI });
