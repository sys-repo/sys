import type { t } from './common.ts';

type Event = t.EventWithKind & { readonly message: string };

const events = {
  open: { kind: 'view:open', message: 'Opened the view' },
  select: { kind: 'item:select', message: 'Selected an item' },
  change: { kind: 'item:change', message: 'Changed the selection' },
  close: { kind: 'view:close', message: 'Closed the view' },
  long: {
    kind: 'selection:changed:waiting-for-confirmation-from-another-view',
    message: 'Waiting for the other view to confirm the selected item.',
  },
} satisfies Record<string, Event>;

const { open, select, change, close } = events;
const sequence = [open, select, change];
const repeated = [...sequence, select, change, change, close, open, select];

/**
 * Oldest first. Each position is an occurrence, even when its event repeats.
 */
export const samples = {
  empty: { label: 'Empty', items: [] },
  single: { label: 'Single event', items: [open] },
  sequence: { label: 'Distinct kinds', items: sequence },
  repeated: { label: 'Mixed with repeats', items: repeated },
  large: {
    label: 'Large mixed set',
    items: Array.from({ length: 1000 }, (_, i) => repeated[i % repeated.length]),
  },
  long: { label: 'Long identifier', items: [events.long] },
} satisfies Record<string, { label: string; items: readonly Event[] }>;

export type SampleId = keyof typeof samples;
export const defaultSample: SampleId = 'large';
