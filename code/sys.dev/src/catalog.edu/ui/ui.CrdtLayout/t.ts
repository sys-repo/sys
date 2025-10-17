import type { t } from './common.ts';

/**
 * Component: CRDT-aware layout shell.
 */
export type CrdtLayoutProps = {
  repo?: t.Crdt.Repo;
  doc?: t.Crdt.Ref;
  signals?: CrdtLayoutSignals;

  slots?: CrdtLayoutSlots;
  header?: CrdtLayoutHeaderConfig;
  sidebar?: CrdtLayoutSidebarConfig;

  theme?: t.CommonTheme;
  debug?: boolean;
  style?: t.CssInput;
};

/**
 * Context passed to all slots.
 */
export type CrdtLayoutCtx = {
  readonly repo?: t.Crdt.Repo;
  readonly doc?: t.Crdt.Ref;
  readonly theme: t.CommonTheme;
  readonly debug: boolean;
};

/**
 * Slots for the CRDT-aware layout shell.
 */
export type CrdtLayoutSlots = {
  main: Slot<CrdtLayoutCtx>;
  sidebar?: Slot<CrdtLayoutCtx>;
  footer?: Slot<CrdtLayoutCtx>;
};
/** Render-prop slot. */
type Slot<TCtx> = (ctx: TCtx) => React.ReactNode;

/**
 * State wrapped in signals.
 */
export type CrdtLayoutSignals = {
  doc?: t.Signal<t.Crdt.Ref | undefined>;
};

/**
 * Configuration of the <DocumentId> header toolbar config.
 */
export type CrdtLayoutHeaderConfig = {
  visible?: boolean;
  readOnly?: boolean;
  localstorage?: t.StringKey;
  urlKey?: t.StringKey;
};

/**
 * Configuration of the sidebar panel.
 */
export type CrdtLayoutSidebarConfig = {
  visible?: boolean;
  position?: 'left' | 'right';
  width?: t.Pixels;
};
