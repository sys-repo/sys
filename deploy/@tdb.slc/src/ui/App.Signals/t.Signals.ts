import type { t } from './common.ts';

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  /** Unique instance of the signals. */
  readonly instance: t.StringId;

  /** Signal properties: */
  readonly props: {
    readonly debug: t.Signal<boolean>;
    readonly dist: t.Signal<t.DistPkg | undefined>;
    readonly stack: t.Signal<t.Content[]>;
    readonly screen: { readonly breakpoint: t.Signal<t.BreakpointName> };
    readonly background: {
      readonly video: {
        readonly src: t.Signal<string>;
        readonly playing: t.Signal<boolean>;
        readonly opacity: t.Signal<t.Percent | undefined>;
        readonly blur: t.Signal<t.Pixels | undefined>;
      };
    };
    readonly controllers: {
      listening: t.Signal<t.AppControllerKind[]>;
    };
  };

  /** API for interacting with the stack. */
  readonly stack: t.AppSignalsStack;
  readonly breakpoint: t.Breakpoint;

  /** Hook into all relevant value listeners. */
  listen(): void;
};

/**
 * API for managing the screen stack.
 */
export type AppSignalsStack = t.SheetSignalStack<t.Content>;
