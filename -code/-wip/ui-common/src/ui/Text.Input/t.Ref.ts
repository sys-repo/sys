import type { t } from './common.ts';

/**
 * A reference to the <Input> acting as an API
 * for manipulating the non-data-stateful state
 * such as focus/caret/selection etc.
 */
export type TextInputRef = {
  readonly current: {
    readonly value: string;
    readonly selection: t.TextInputSelection;
    readonly focused: boolean;
  };
  events(dispose$?: t.UntilObservable): t.TextInputEvents;
  focus(select?: boolean): void;
  blur(): void;
  caretToStart(): void;
  caretToEnd(): void;
  selectAll(): void;
  select(start: number | null, end?: number | null, direction?: SelectDirection): void;
};

type SelectDirection = 'none' | 'forward' | 'backward';
