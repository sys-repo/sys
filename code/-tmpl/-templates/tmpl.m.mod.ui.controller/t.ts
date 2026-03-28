import type { t } from './common.ts';

/**
 *
 */
export declare namespace MyCtrl {
  export type Lib = {
    readonly controller: ControllerFactory;
    readonly UI: {
      readonly Controlled: t.FC<ControlledProps>;
      readonly Uncontrolled: t.FC<Props>;
    };
  };

  /**
   * Component:
   */
  export type Props = {
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /**
   * Controlled Component:
   */
  export type ControlledProps = {
    debug?: t.Signal<boolean | undefined>;
    theme?: t.Signal<t.CommonTheme | undefined>;
    style?: t.CssInput;
  };

  /**
   * Controller (State)
   */
  export type ControllerArgs = {
    props?: Pick<Props, 'debug' | 'theme'>;
    debug?: t.Signal<boolean | undefined>;
    theme?: t.Signal<t.CommonTheme | undefined>;
  };
  export type ControllerFactory = (args: ControllerArgs) => Controller;
  export type Controller = t.Lifecycle & {
    readonly rev: t.NumberMonotonic;
    readonly view: () => Pick<Props, 'debug' | 'theme'>;
    readonly state: {
      readonly debug: t.ReadonlySignal<boolean | undefined>;
      readonly theme: t.ReadonlySignal<t.CommonTheme | undefined>;
    };
    readonly listen: () => void;
  };
}
