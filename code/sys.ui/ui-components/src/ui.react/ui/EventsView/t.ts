import type { t } from './common.ts';

/**
 * A readout for displaying status and inspecting events.
 */
export declare namespace EventsView {
  /** The host supplies events and owns retention and announcements. */
  export type Lib = {
    /** Show the latest supplied event and its history together. */
    readonly UI: <E extends t.EventWithKind>(props: Props<E>) => t.ReactNode;
    /** Show the count or list inside an existing row, without adding a label or frame. */
    readonly Value: <E extends t.EventWithKind>(props: ValueProps<E>) => t.ReactNode;
  };

  /** Event display options with controls for the surrounding readout. */
  export type Props<E extends t.EventWithKind = t.EventWithKind> = ValueProps<E> & {
    /**
     * Defaults to `latest event` and `events`. A custom `events` label is rendered as supplied
     * rather than made into a disclosure control. The count still toggles when history is available.
     */
    readonly labels?: { readonly latest?: t.ReactNode; readonly events?: t.ReactNode };
    /** Use monospace for event values only; labels and counts remain sans-serif. Defaults to false. */
    readonly mono?: boolean;
    readonly debug?: boolean;
  };

  /** Event display options shared by the standalone readout and the unframed value. */
  export type ValueProps<E extends t.EventWithKind = t.EventWithKind> = {
    /** Supply occurrences oldest first; repeats are distinct. History is displayed newest first. */
    readonly items: readonly E[];
    /** Host-owned count disclosure. Omit for local state, initially closed. */
    readonly disclosure?: Disclosure;
    /** Presentation mode; defaults to `count`. */
    readonly mode?: Mode;
    /**
     * Limit displayed history to the newest N without changing the count or the latest summary.
     * Omitted or non-finite shows all supplied events; finite values round down to a minimum of 0.
     * With a limit of 0, a nonzero count is plain text with no disclosure control.
     */
    readonly tail?: number;
    /** Render an occurrence synchronously in the summary and history. Defaults to its literal `kind`. */
    readonly renderItem?: (event: E) => t.ReactNode;
    readonly theme?: t.CommonTheme;
    readonly style?: t.Style.Input;
  };

  /** The viewer requests a change on activation; rendering never changes the host's value. */
  export type Disclosure = {
    readonly expanded: boolean;
    readonly onToggle: (next: boolean) => void;
  };

  /** `count` shows the supplied count and reveals history on demand; `list` shows history directly. */
  export type Mode = 'count' | 'list';
}
