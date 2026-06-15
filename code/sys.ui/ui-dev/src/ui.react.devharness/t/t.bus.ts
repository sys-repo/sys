import type { t } from './common.ts';

type SpecId = t.StringId;
type O = Record<string, unknown>;

/**
 * Represents a single instance of the DevHarness.
 */
export type DevInstance = { bus: t.EventBus<any>; id: t.StringId };

/**
 * Environment vars passed in to the DevHarness.
 */
export type DevEnvVars = any;

/**
 * DevHarness events API.
 */
export type DevEvents = t.Lifecycle & {
  $: t.Observable<t.DevEvent>;
  instance: DevInstance;
  is: { base(input: any): boolean };
  info: {
    req$: t.Observable<t.DevInfoReq>;
    res$: t.Observable<t.DevInfoRes>;
    changed$: t.Observable<t.DevInfoChanged>;
    fire(options?: { timeout?: t.Msecs }): Promise<t.DevInfoRes>;
    get(options?: { timeout?: t.Msecs }): Promise<t.DevInfo>;
  };
  ctx: {
    req$: t.Observable<t.DevCtxReq>;
    res$: t.Observable<t.DevCtxRes>;
    fire(options?: { timeout?: t.Msecs }): Promise<t.DevCtxRes>;
    get(options?: { timeout?: t.Msecs }): Promise<t.DevCtx>;
  };
  load: {
    req$: t.Observable<t.DevLoadReq>;
    res$: t.Observable<t.DevLoadRes>;
    fire(bundle?: t.BundleImport, options?: { timeout?: t.Msecs }): Promise<t.DevLoadRes>;
  };
  run: {
    req$: t.Observable<t.DevRunReq>;
    res$: t.Observable<t.DevRunRes>;
    fire(options?: { only?: SpecId | SpecId[]; timeout?: t.Msecs }): Promise<t.DevRunRes>;
  };
  reset: {
    req$: t.Observable<t.DevResetReq>;
    res$: t.Observable<t.DevResetRes>;
    fire(options?: { timeout?: t.Msecs }): Promise<DevResetRes>;
  };
  state: {
    changed$: t.Observable<t.DevInfoChanged>;
    change: {
      req$: t.Observable<t.DevStateChangeReq>;
      res$: t.Observable<t.DevStateChangeRes>;
      fire<T extends O>(
        initial: T,
        mutate: t.DevInfoStateMutater<T> | T,
        options?: { timeout?: t.Msecs },
      ): Promise<DevStateChangeRes>;
    };
    object<T extends O>(initial: T): t.DevCtxState<T>;
  };
  props: {
    changed$: t.Observable<t.DevInfoChanged>;
    change: {
      req$: t.Observable<t.DevPropsChangeReq>;
      res$: t.Observable<t.DevPropsChangeRes>;
      fire(
        mutate: t.DevInfoPropsMutater,
        options?: { timeout?: t.Msecs },
      ): Promise<DevStateChangeRes>;
    };
    flush: {
      pending$: t.Observable<t.DevPropsFlushPending>;
      pending(revision: number): void;
    };
  };
  redraw: {
    $: t.Observable<t.DevRedraw>;
    fire(args: { target?: t.DevRedrawTarget; renderers?: t.StringId[] }): void;
    subject(): Promise<t.StringId[]>;
    harness(): Promise<t.StringId[]>;
    debug(): Promise<t.StringId[]>;
  };
};

/**
 * Event definitions.
 */
export type DevEvent =
  | DevInfoReqEvent
  | DevInfoResEvent
  | DevCtxReqEvent
  | DevCtxResEvent
  | DevInfoChangedEvent
  | DevLoadReqEvent
  | DevLoadResEvent
  | DevRunReqEvent
  | DevRunResEvent
  | DevResetReqEvent
  | DevResetResEvent
  | DevStateChangeReqEvent
  | DevStateChangeResEvent
  | DevPropsChangeReqEvent
  | DevPropsChangeResEvent
  | DevPropsFlushPendingEvent
  | DevRedrawEvent;

/**
 * Module info.
 */
export type DevInfoReqEvent = {
  type: 'sys.dev/info:req';
  payload: DevInfoReq;
};
/** Request payload for retrieving module info from a harness instance. */
export type DevInfoReq = { tx: string; instance: t.StringId };

/** Event carrying module info response data. */
export type DevInfoResEvent = {
  type: 'sys.dev/info:res';
  payload: DevInfoRes;
};
/** Response payload containing current module info or an error. */
export type DevInfoRes = {
  tx: string;
  instance: t.StringId;
  info?: t.DevInfo;
  error?: string;
};


/** Event emitted when module info changes. */
export type DevInfoChangedEvent = {
  type: 'sys.dev/info:changed';
  payload: DevInfoChanged;
};
/** Payload describing the latest module info and change reason. */
export type DevInfoChanged = {
  instance: t.StringId;
  info: t.DevInfo;
  message: t.DevInfoChangeMessage;
};

/**
 * Context: {ctx}
 */
export type DevCtxReqEvent = {
  type: 'sys.dev/ctx:req';
  payload: DevCtxReq;
};

/**
 * Request for the current dev context.
 */
export type DevCtxReq = { tx: string; instance: t.StringId };

/**
 * Event delivering a context response.
 */
export type DevCtxResEvent = {
  type: 'sys.dev/ctx:res';
  payload: DevCtxRes;
};

/**
 * The response containing the requested current Dev context.
 */
export type DevCtxRes = { tx: string; instance: t.StringId; ctx?: t.DevCtx; error?: string };

/**
 * Initialize (with Spec)
 */
export type DevLoadReqEvent = {
  type: 'sys.dev/load:req';
  payload: DevLoadReq;
};
/** Request payload for loading a spec bundle into a harness instance. */
export type DevLoadReq = { tx: string; instance: t.StringId; bundle?: t.BundleImport };

/** Event carrying a spec-load response. */
export type DevLoadResEvent = {
  type: 'sys.dev/load:res';
  payload: DevLoadRes;
};
/** Response payload containing post-load module info or an error. */
export type DevLoadRes = { tx: string; instance: t.StringId; info?: t.DevInfo; error?: string };

/**
 * Run the suite of tests.
 */
export type DevRunReqEvent = { type: 'sys.dev/run:req'; payload: DevRunReq };
/** Request payload for running all or part of a loaded spec suite. */
export type DevRunReq = {
  tx: string;
  instance: t.StringId;
  only?: SpecId[];
};

/** Event carrying a spec-run response. */
export type DevRunResEvent = { type: 'sys.dev/run:res'; payload: DevRunRes };
/** Response payload containing post-run module info or an error. */
export type DevRunRes = { tx: string; instance: t.StringId; info?: t.DevInfo; error?: string };

/**
 * Reset context/state.
 */
export type DevResetReqEvent = { type: 'sys.dev/reset:req'; payload: DevResetReq };
/** Request payload for resetting a harness context and state. */
export type DevResetReq = { tx: string; instance: t.StringId };

/** Event carrying a reset response. */
export type DevResetResEvent = { type: 'sys.dev/reset:res'; payload: DevResetRes };
/** Response payload containing post-reset module info or an error. */
export type DevResetRes = { tx: string; instance: t.StringId; info?: t.DevInfo; error?: string };

/**
 * Props mutation.
 * Generated by Specs using the {ctx} object.
 * Used to specify the display/harness render props.
 */
export type DevPropsChangeReqEvent = {
  type: 'sys.dev/props/change:req';
  payload: DevPropsChangeReq;
};
/** Request payload for mutating render props from a spec context. */
export type DevPropsChangeReq = {
  tx: string;
  instance: t.StringId;
  mutate: t.DevInfoPropsMutater;
};

/** Event carrying a render-props mutation response. */
export type DevPropsChangeResEvent = {
  type: 'sys.dev/props/change:res';
  payload: DevPropsChangeRes;
};
/** Response payload containing module info after a render-props mutation. */
export type DevPropsChangeRes = {
  tx: string;
  instance: t.StringId;
  info?: t.DevInfo;
  error?: string;
};

/** Event emitted when a render-props revision is waiting to flush. */
export type DevPropsFlushPendingEvent = {
  type: 'sys.dev/props/flush:pending';
  payload: DevPropsFlushPending;
};
/** Pending render-props revision for a harness instance. */
export type DevPropsFlushPending = { instance: t.StringId; revision: number };

/**
 * State mutation.
 */
export type DevStateChangeReqEvent = {
  type: 'sys.dev/state/change:req';
  payload: DevStateChangeReq;
};
/** Request payload for mutating spec-owned state. */
export type DevStateChangeReq = {
  tx: string;
  instance: t.StringId;
  mutate: t.DevInfoStateMutater<O> | O;
  initial: O;
};

/** Event carrying a spec-state mutation response. */
export type DevStateChangeResEvent = {
  type: 'sys.dev/state/change:res';
  payload: DevStateChangeRes;
};
/** Response payload containing module info after a state mutation. */
export type DevStateChangeRes = {
  tx: string;
  instance: t.StringId;
  info?: t.DevInfo;
  error?: string;
};

/**
 * Redraw
 */
export type DevRedrawEvent = {
  type: 'sys.dev/redraw';
  payload: DevRedraw;
};
/** Payload identifying which renderers should redraw. */
export type DevRedraw = {
  instance: t.StringId;
  renderers: t.StringId[];
  target?: t.DevRedrawTarget;
};
