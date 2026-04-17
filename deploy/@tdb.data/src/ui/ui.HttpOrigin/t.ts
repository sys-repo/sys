import type { t } from './common.ts';

/**
 * Visual selector for staged-data HTTP origins.
 */
export declare namespace HttpOrigin {
  /** Public `HttpOrigin` library surface. */
  export type Lib = {
    readonly UI: {
      readonly Uncontrolled: t.FC<Props>;
      readonly Controlled: t.FC<ControlledProps>;
    };
    readonly Default: {
      readonly env: t.HttpOriginBase.Env;
      readonly spec: SpecMap;
      readonly verify: t.HttpOriginBase.Verify;
    };
    readonly use: {
      readonly Controller: UseController;
    };
  };

  /** Shared controlled prop shape from the upstream `HttpOriginBase`. */
  type CPropsBase = t.HttpOriginBase.ControlledProps;

  /** Data origin map keyed by environment. */
  export type SpecMap = t.HttpOriginBase.SpecMap<t.HttpOriginBase.Env>;
  /** Uncontrolled `HttpOrigin` props. */
  export type Props = Omit<t.HttpOriginBase.Props, 'spec'> & { spec?: SpecMap };
  /** Controlled `HttpOrigin` props. */
  export type ControlledProps = Omit<CPropsBase, 'spec'> & { spec?: SpecMap };

  /** Hook for persisted `HttpOrigin` env state. */
  export type UseController = (storage: string) => ControllerState;
  /** Persisted controller state for `HttpOrigin`. */
  export type ControllerState = {
    readonly env: t.Signal<t.HttpOriginBase.Env | undefined>;
  };
}
