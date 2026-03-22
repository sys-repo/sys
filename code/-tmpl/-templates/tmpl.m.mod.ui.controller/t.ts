import type { t } from './common.ts';

/**
 *
 */
export type MyCtrlLib = {
  readonly controller: t.MyCtrlControllerFactory;
  readonly UI: {
    readonly Controlled: t.FC<MyCtrlControlledProps>;
    readonly Uncontrolled: t.FC<MyCtrlProps>;
  };
};

/**
 * Component:
 */
export type MyCtrlProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Controlled Component:
 */
export type MyCtrlControlledProps = {
  debug?: t.Signal<boolean | undefined>;
  theme?: t.Signal<t.CommonTheme | undefined>;
  style?: t.CssInput;
};

/**
 * Controller (State)
 */
type CtrlArgs = {
  props?: Pick<MyCtrlProps, 'debug' | 'theme'>;
  debug?: t.Signal<boolean | undefined>;
  theme?: t.Signal<t.CommonTheme | undefined>;
};
export type MyCtrlControllerFactory = (args: CtrlArgs) => MyCtrlController;
export type MyCtrlController = t.Lifecycle & {
  readonly rev: t.NumberMonotonic;
  readonly view: () => Pick<MyCtrlProps, 'debug' | 'theme'>;
  readonly state: {
    readonly debug: t.ReadonlySignal<boolean | undefined>;
    readonly theme: t.ReadonlySignal<t.CommonTheme | undefined>;
  };
  readonly listen: () => void;
};
