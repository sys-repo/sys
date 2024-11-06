import type { t } from './common.ts';

type C = t.CmdBarRef | t.CmdBarCtrl | t.Cmd<t.CmdBarCtrlType>;

export type MainField = 'Module.Args' | 'Module.Run';

/**
 * Component: <Main>
 */
export type MainProps = {
  fields?: (t.MainField | undefined | null)[];
  argsCard?: t.MainArgsCardProps;
  run?: t.MainRunProps;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * Component: <Config>
 */
export type MainConfigProps = {
  title?: string | [string, string];
  state?: t.MainImmutable;
  useStateController?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * Component: <ArgsCard>
 */
export type MainArgsCardProps = {
  ctrl?: C;
  size?: t.SizeTuple;
  title?: boolean | { left?: string; right?: string };
  argv?: string;
  focused?: { cmdbar?: boolean };
  theme?: t.CommonTheme;
  style?: t.CssValue;
};

/**
 * Component: <Run>
 */
export type MainRunProps = {
  ctrl?: C;
  argv?: string;
  theme?: t.CommonTheme;
  style?: t.CssValue;
  onArgsChanged?: t.MainRunHandler;
  onInvoke?: t.MainRunHandler;
};

export type MainRunHandler = (e: MainRunHandlerArgs) => void | Promise<void>;
export type MainRunHandlerArgs = {
  theme: t.CommonTheme;
  argv: string;
  args: t.ParsedArgs;
  render(el: t.RenderOutput): void;
};

/**
 * Immutable Wrapper
 */
export type MainImmutable = t.ImmutableRef<
  t.MainProps,
  t.PatchOperation,
  t.ImmutableEvents<t.MainProps, t.PatchOperation>
>;
