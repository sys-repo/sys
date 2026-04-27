import type { t } from '../common.ts';

export declare namespace Browser {
  export type Lib = {
    /**
     * Load a URL in a local Chrome/Chromium instance via the Chrome DevTools Protocol
     * and report browser runtime errors.
     */
    load(url: string, options?: Load.Options): Promise<Load.Result>;
  };

  /** Browser backend used for the load assertion. */
  export type Kind = 'Chrome';

  export namespace Load {
    export type Options = {
      /** Browser backend. Defaults to Chrome. */
      browser?: Kind;
      /** Browser executable path. Defaults to CHROME_BIN or common platform locations. */
      executablePath?: t.StringAbsolutePath;
      /** Milliseconds to wait after Page.loadEventFired before closing the browser. */
      waitAfterLoad?: t.Msecs;
      /** Predicate for known benign browser errors. */
      allowError?: (text: string) => boolean;
    };

    export type Result = {
      readonly ok: boolean;
      readonly url: string;
      readonly browser: Kind;
      readonly executablePath?: t.StringAbsolutePath;
      readonly errors: readonly string[];
      readonly stderr: string;
    };
  }
}
