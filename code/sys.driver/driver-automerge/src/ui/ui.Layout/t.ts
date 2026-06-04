import type { t } from './common.ts';

type Slot<TCtx> = (ctx: TCtx) => React.ReactNode;

/**
 * CRDT-aware layout shell contracts.
 */
export declare namespace Layout {
  /** Component API for the CRDT-aware layout shell. */
  export type Lib = {
    readonly View: t.FC<Props>;
    readonly defaults: Defaults;
    edgeBorder(theme: t.ColorTheme, opacity?: t.Percent): string;
  };

  /** Public defaults for the layout. */
  export type Defaults = {
    readonly header: Header;
    readonly sidebar: Sidebar;
    readonly cropmarks: Cropmarks;
  };

  /** Component props. */
  export type Props = {
    slots?: Slots;
    signals?: Signals;
    crdt?: Bindings;
    header?: Header;
    sidebar?: Sidebar;
    cropmarks?: Cropmarks;
    spinning?: boolean | Spinning;
    theme?: t.CommonTheme;
    debug?: boolean;
    style?: t.CssInput;
  };

  /** CRDT bindings passed into the layout. */
  export type Bindings = {
    readonly repo?: t.Crdt.Repo;
    readonly storageKey?: t.StringKey;
    readonly urlKey?: t.StringKey;
  };

  /** Context passed to all slots. */
  export type Ctx = {
    readonly theme: t.CommonTheme;
    readonly debug: boolean;
    readonly repo: t.Crdt.Repo;
    readonly doc?: t.Crdt.Ref;
  };

  /** Child view-render slots within the layout shell. */
  export type Slots = {
    main?: Slot<Ctx>;
    sidebar?: Slot<Ctx>;
    footer?: Slot<Ctx>;
  };

  /** Layout slot name. */
  export type SlotName = keyof Slots;

  /** Stateful live signals. */
  export type Signals = {
    readonly doc: t.Signal<t.Crdt.Ref | undefined>;
  };

  /** Configuration of the `<DocumentId>` header toolbar. */
  export type Header = {
    visible?: boolean;
    readOnly?: boolean;
  };

  /** Configuration of the sidebar panel. */
  export type Sidebar = {
    position?: 'left' | 'right';
    visible?: boolean;
    resizable?: boolean;
    width?: t.Pixels;
    divider?: t.PercentOpacity;
  };

  /** Configuration of the crop-marks within the `main` slot container. */
  export type Cropmarks = Pick<
    t.CropmarksProps,
    'size' | 'borderWidth' | 'borderColor' | 'borderOpacity' | 'subjectOnly'
  >;

  /** Spinning flags. */
  export type Spinning = {
    readonly main?: boolean;
    readonly sidebar?: boolean;
    readonly footer?: boolean;
  };
}
