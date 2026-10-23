import type { t } from '../common.ts';

/**
 * Tools for working with a terminal screen.
 */
export declare namespace CliScreen {
  /** Terminal screen helper library contract. */
  export type Lib = {
    /** Measure the terminal’s current width and height in character cells. */
    size(): Size;

    /** Listen to events related to the terminal screen. */
    events(until?: t.UntilInput): Events;

    /** Replace the complete stdout terminal frame without a leading full-screen clear. */
    repaint(frame: string): void;

    /** Pure placement helpers for bounded screen regions. */
    readonly Dock: Dock.Lib;
  };

  /** Current terminal dimensions in character cells, each bounded to 65,535. */
  export type Size = {
    /** Terminal width in character cells. */
    readonly width: number;
    /** Terminal height in character cells. */
    readonly height: number;
  };

  /** Terminal screen events. */
  export type Events = t.Lifecycle & {
    readonly $: t.Observable<Event>;
    readonly resize$: t.Observable<SizeChanged>;
  };

  /** Terminal screen event union. */
  export type Event = SizeChanged;

  /** Pure placement helpers for bounded screen regions. */
  export namespace Dock {
    export type Lib = {
      /** Keep an optional complete footer docked at the bottom of a bounded region. */
      readonly bottom: Bottom;
    };

    /** Pure bounded vertical layout for a flowing screen region and optional footer. */
    export type Bottom = (args: Bottom.Args) => string[];

    export namespace Bottom {
      /** Inputs for one bounded flowing region and its optional bottom footer. */
      export type Args = {
        /** Maximum available rows. Invalid values are treated as zero. */
        readonly capacity: number;
        /** Flowing rows whose beginning is retained under height pressure. */
        readonly flow: readonly string[];
        /** Optional all-or-nothing rows reserved at the bottom when they fit. */
        readonly footer?: readonly string[];
      };
    }
  }

  /** Terminal resize event. */
  export type SizeChanged = {
    /** Terminal resize event discriminant. */
    readonly kind: 'size:changed';
    /** Terminal size before the resize. */
    readonly before: Size;
    /** Terminal size after the resize. */
    readonly after: Size;
  };
}
