import type { t } from './common.ts';
type Slot<TCtx> = (ctx: TCtx) => React.ReactNode;

/**
 * Component API: CRDT-aware layout shell.
 */
export type CrdtLayoutLib = {
  View: React.FC<CrdtLayoutProps>;
  edgeBorder(theme: t.ColorTheme, opacity?: t.Percent): string;
};

/**
 * Component: CRDT-aware layout shell.
 */
export type CrdtLayoutProps = {
  slots?: CrdtLayoutSlots; // child views.
  signals?: t.CrdtLayoutSignals;

  // Config:
  crdt?: CrdtLayoutBindings;
  header?: CrdtLayoutHeader;
  sidebar?: CrdtLayoutSidebar;
  cropmarks?: CrdtLayoutCropmarks;

  // Appearance:
  spinning?: boolean | CrdtLayoutSpinning;
  theme?: t.CommonTheme;
  debug?: boolean;
  style?: t.CssInput;
};

/**
 * CRDT bindings passed into the layout.
 */
export type CrdtLayoutBindings = {
  readonly repo?: t.Crdt.Repo;
  readonly storageKey?: t.StringKey;
  readonly urlKey?: t.StringKey;
};

/**
 * Context passed to all slots.
 */
export type CrdtLayoutCtx = {
  readonly theme: t.CommonTheme;
  readonly debug: boolean;
  readonly repo: t.Crdt.Repo;
  readonly doc?: t.Crdt.Ref;
};

/**
 * Child view-render slots within the layout shell.
 */
export type CrdtLayoutSlots = {
  main?: Slot<CrdtLayoutCtx>;
  sidebar?: Slot<CrdtLayoutCtx>;
  footer?: Slot<CrdtLayoutCtx>;
};

/**
 * Stateful live signals.
 */
export type CrdtLayoutSignals = {
  readonly doc: t.Signal<t.Crdt.Ref | undefined>;
};

/**
 * Configuration of the <DocumentId> header toolbar config.
 */
export type CrdtLayoutHeader = {
  visible?: boolean;
  readOnly?: boolean;
};

/**
 * Configuration of the sidebar panel.
 */
export type CrdtLayoutSidebar = {
  visible?: boolean;
  position?: 'left' | 'right';
  width?: t.Pixels;
};

/** Configuration of the crop-marks within the `main` slot container. */
export type CrdtLayoutCropmarks = Pick<
  t.CropmarksProps,
  'size' | 'borderWidth' | 'borderColor' | 'borderOpacity' | 'subjectOnly'
>;

/** Spinning flags. */
export type CrdtLayoutSpinning = {
  readonly main?: boolean;
  readonly sidebar?: boolean;
  readonly footer?: boolean;
};
