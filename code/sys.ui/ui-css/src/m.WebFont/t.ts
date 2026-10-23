import type { t } from './common.ts';
import type * as TConfig from './t.font.config.ts';

/**
 * Web-font contracts.
 */
export declare namespace WebFont {
  /**
   * Runtime library surface.
   */
  export type Lib = {
    /** Injects @font-face rules for the given family into <head> once. */
    inject(dir: t.StringDir, opts: Config): Inject.Result;

    /** Return a defensive web-font config copy. */
    def(opts: Config): Config;
  };

  /** Web-font configuration options. */
  export type Config = TConfig.Config;

  /**
   * Web-font injection contracts.
   */
  export namespace Inject {
    /** Result from the `WebFont.inject` method. */
    export type Result = {
      readonly id: string;
      readonly injected: boolean;
    };
  }
}
