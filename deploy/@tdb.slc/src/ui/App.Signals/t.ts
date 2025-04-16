import type { t } from './common.ts';
export type * from './t.Content.ts';

/**
 * Library for working with the [AppSignals] model.
 */
export type AppSignalsLib = {
  /** Create a new instance of the application-state signals API. */
  create(dispose$?: t.UntilObservable): t.AppSignals;
};

/**
 * Global application-state signals API.
 */
export type AppSignals = {
  readonly props: {
    readonly dist: t.Signal<t.DistPkg | undefined>;
    readonly stack: t.Signal<t.Content[]>;
    readonly screen: { readonly breakpoint: t.Signal<t.BreakpointName> };

    readonly background: {
      readonly video: {
        readonly src: t.Signal<string>;
        readonly playing: t.Signal<boolean>;
        readonly opacity: t.Signal<t.Percent | undefined>;
        readonly blur: t.Signal<t.Percent | undefined>;
      };
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
