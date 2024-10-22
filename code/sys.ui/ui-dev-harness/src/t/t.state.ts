import type { t } from './common.ts';

type Id = string;
type O = Record<string, unknown>;

export type DevInfo = {
  instance: { kind: 'dev:harness'; session: Id; bus: Id };
  spec?: t.TestSuiteModel;
  env?: t.DevEnvVars;
  render: DevInfoRender;
  run: { count: number; results?: t.TestSuiteRunResponse };
};

export type DevInfoRender = {
  revision: { props: number; state: number };
  props?: t.DevRenderProps;
  state?: O;
};

export type DevInfoMutater = (draft: t.DevInfo) => t.IgnoredResponse;
export type DevInfoStateMutater<T extends O> = (draft: T) => t.IgnoredResponse;
export type DevInfoPropsMutater = (draft: t.DevRenderProps) => t.IgnoredResponse;

export type DevInfoChangeMessage =
  | 'state:write'
  | 'props:write'
  | 'context:init'
  | 'spec:load'
  | 'run:all'
  | 'run:subset'
  | 'reset';
