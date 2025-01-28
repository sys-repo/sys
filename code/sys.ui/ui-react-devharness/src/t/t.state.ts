import type { t } from './common.ts';

type Id = string;
type O = Record<string, unknown>;

/**
 * State of the loaded spec.
 */
export type DevInfo = {
  instance: { kind: 'dev:harness'; session: Id; bus: Id };
  spec?: t.TestSuiteModel;
  env?: t.DevEnvVars;
  render: DevInfoRender;
  run: { count: number; results?: t.TestSuiteRunResponse };
};

/**
 * Info used to render a spec.
 */
export type DevInfoRender = {
  revision: { props: number; state: number };
  props?: t.DevRenderProps;
  state?: O;
};

/**
 * Mutates an immutable DevInfo object.
 */
export type DevInfoMutater = (draft: t.DevInfo) => t.IgnoredResponse;

/**
 * Info state mutator.
 */
export type DevInfoStateMutater<T extends O> = (draft: T) => t.IgnoredResponse;

/**
 * Info props mutator.
 */
export type DevInfoPropsMutater = (draft: t.DevRenderProps) => t.IgnoredResponse;

/**
 * Info change message kinds.
 */
export type DevInfoChangeMessage =
  | 'state:write'
  | 'props:write'
  | 'context:init'
  | 'spec:load'
  | 'run:all'
  | 'run:subset'
  | 'reset';
