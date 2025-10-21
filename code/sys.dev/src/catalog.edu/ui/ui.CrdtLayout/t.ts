import type { t } from './common.ts';

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

  // Config:
  crdt?: CrdtLayoutBindings;
  header?: CrdtLayoutHeaderConfig;
  sidebar?: CrdtLayoutSidebarConfig;

  theme?: t.CommonTheme;
  debug?: boolean;
  style?: t.CssInput;
};

/**
 * CRDT bindings passed into the layout.
 * - `repo` and `doc` are required when provided (the layout expects both together).
 * - `signals` are optional; when present, the layout reacts to external doc changes.
 */
export type CrdtLayoutBindings = {
  readonly repo?: t.Crdt.Repo;
  readonly signals?: {
    readonly doc: t.Signal<t.Crdt.Ref | undefined>;
  };

  // Persistence/configuration keys:
  readonly localstorage?: t.StringKey;
  readonly urlKey?: t.StringKey;
};

/**
 * Context passed to all slots.
 */
export type CrdtLayoutCtx = {
  readonly theme: t.CommonTheme;
  readonly debug: boolean;
  readonly repo: t.Crdt.Repo;
  readonly doc: t.Crdt.Ref;
};

/**
 * Slots for the CRDT-aware layout shell.
 */
export type CrdtLayoutSlots = {
  main?: Slot<CrdtLayoutCtx>;
  sidebar?: Slot<CrdtLayoutCtx>;
  footer?: Slot<CrdtLayoutCtx>;
};
/** Render-prop slot. */
type Slot<TCtx> = (ctx: TCtx) => React.ReactNode;

/**
 * State wrapped in signals.
 */
export type CrdtLayoutSignals = {
  doc: t.Signal<t.Crdt.Ref | undefined>;
};

/**
 * Configuration of the <DocumentId> header toolbar config.
 */
export type CrdtLayoutHeaderConfig = {
  visible?: boolean;
  readOnly?: boolean;
};

/**
 * Configuration of the sidebar panel.
 */
export type CrdtLayoutSidebarConfig = {
  visible?: boolean;
  position?: 'left' | 'right';
  width?: t.Pixels;
};
