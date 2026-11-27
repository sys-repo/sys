import type { t } from './common.ts';

export type * from '../common.t.ts';

/** Shared by the label and count that control the same history panel. */
export type Disclosure = {
  readonly expanded: boolean;
  readonly controls: string;
  readonly onToggle: () => void;
};

export type ItemsProps<E extends t.EventWithKind> = Pick<
  t.EventsView.ValueProps<E>,
  'items' | 'renderItem'
>;
