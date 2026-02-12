import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Component:
 */
export type ActionProbeProps<TEnv extends O = O, TParams extends O = O> = {
  spec?: t.ActionProbe.ProbeSpec<TEnv, TParams>;
  /** @deprecated Use `spec`. */
  sample?: t.ActionProbe.ProbeSpec<TEnv, TParams>;
  env: TEnv;
  /**
   * External run trigger token.
   * When this value changes (after mount), Probe invokes `run`.
   */
  runRequest?: unknown;
  spinning?: boolean;
  focused?: boolean;
  actOn?: t.ActionProbe.ActOn;
  borderRadius?: t.Pixels;
  onRunStart?: (args?: t.ActionProbeRunStartArgs) => void;
  onRunEnd?: () => void;
  onRunResult?: (value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig) => void;
  onRunItem?: (item: t.KeyValueItem) => void;
  onFocus?: () => void;
  onBlur?: () => void;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export type ActionResultProps = {
  title?: t.ReactNode;
  spinning?: boolean;
  resultsVisible?: boolean;
  response?: unknown;
  items?: readonly t.KeyValueItem[];
  obj?: t.ActionProbe.ProbeRunObjectConfig;
  header?: { mono?: boolean };
  debug?: boolean;
  sizeMode?: 'fill' | 'auto';
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onResultsVisibleChange?: (next: boolean) => void;
};
