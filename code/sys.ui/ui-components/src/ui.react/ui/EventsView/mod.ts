/**
 * @module
 * A readout for displaying status and inspecting events.
 */
import type { t } from './common.ts';
import { EventsView as UI } from './ui.tsx';
import { Value } from './ui.Value.tsx';

/**
 * Use `UI` for a standalone readout or `Value` inside an existing row.
 */
export const EventsView: t.EventsView.Lib = Object.freeze({ UI, Value });
