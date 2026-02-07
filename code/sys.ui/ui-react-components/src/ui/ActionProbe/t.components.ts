import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Component:
 */
export type ActionProbeProps<TEnv extends O = O, TParams extends O = O> = {
  sample: t.ActionProbe.ProbeSpec<TEnv, TParams>;
  env: TEnv;
  spinning?: boolean;
  onRunStart?: () => void;
  onRunEnd?: () => void;
  onRunResult?: (value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig) => void;
  onRunItem?: (item: t.KeyValueItem) => void;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export type ActionResultProps = {
  spinning?: boolean;
  response?: unknown;
  obj?: t.ActionProbe.ProbeRunObjectConfig;
  items?: readonly t.KeyValueItem[];
  header?: { mono?: boolean };
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
