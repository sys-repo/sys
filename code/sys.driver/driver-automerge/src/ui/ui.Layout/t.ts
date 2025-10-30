import type { t } from './common.ts';

type Slot<TCtx> = (ctx: TCtx) => React.ReactNode;

/**
 * Component API: CRDT-aware layout shell.
 */
export type LayoutLib = {
  readonly View: t.FC<LayoutProps>;
  readonly defaults: LayoutDefaults;
  edgeBorder(theme: t.ColorTheme, opacity?: t.Percent): string;
};

/** Public defaults for the layout. */
export type LayoutDefaults = {
  readonly header: t.LayoutHeader;
  readonly sidebar: t.LayoutSidebar;
  readonly cropmarks: t.LayoutCropmarks;
};

/**
 * Component: CRDT-aware layout shell.
 */
export type LayoutProps = {
  slots?: LayoutSlots; // child views.
  signals?: t.LayoutSignals;

  // Config:
  crdt?: LayoutBindings;
  header?: LayoutHeader;
  sidebar?: LayoutSidebar;
  cropmarks?: LayoutCropmarks;

  // Appearance:
  spinning?: boolean | LayoutSpinning;
  theme?: t.CommonTheme;
  debug?: boolean;
  style?: t.CssInput;
};

/**
 * CRDT bindings passed into the layout.
 */
export type LayoutBindings = {
  readonly repo?: t.Crdt.Repo;
  readonly storageKey?: t.StringKey;
  readonly urlKey?: t.StringKey;
};

/**
 * Context passed to all slots.
 */
export type LayoutCtx = {
  readonly theme: t.CommonTheme;
  readonly debug: boolean;
  readonly repo: t.Crdt.Repo;
  readonly doc?: t.Crdt.Ref;
};

/**
 * Child view-render slots within the layout shell.
 */
export type LayoutSlots = {
  main?: Slot<LayoutCtx>;
  sidebar?: Slot<LayoutCtx>;
  footer?: Slot<LayoutCtx>;
};

/**
 * Stateful live signals.
 */
export type LayoutSignals = {
  readonly doc: t.Signal<t.Crdt.Ref | undefined>;
};

/**
 * Configuration of the <DocumentId> header toolbar config.
 */
export type LayoutHeader = {
  visible?: boolean;
  readOnly?: boolean;
};

/**
 * Configuration of the sidebar panel.
 */
export type LayoutSidebar = {
  position?: 'left' | 'right';
  visible?: boolean;
  resizable?: boolean;
  width?: t.Pixels;
  divider?: t.PercentOpacity;
};

/** Configuration of the crop-marks within the `main` slot container. */
export type LayoutCropmarks = Pick<
  t.CropmarksProps,
  'size' | 'borderWidth' | 'borderColor' | 'borderOpacity' | 'subjectOnly'
>;

/** Spinning flags. */
export type LayoutSpinning = {
  readonly main?: boolean;
  readonly sidebar?: boolean;
  readonly footer?: boolean;
};
