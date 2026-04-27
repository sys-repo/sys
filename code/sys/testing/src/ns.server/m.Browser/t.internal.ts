import type { Browser as PublicBrowser } from './t.ts';

export declare namespace Browser {
  export type Lib = PublicBrowser.Lib;
  export type Kind = PublicBrowser.Kind;

  export namespace Load {
    export type Options = PublicBrowser.Load.Options;
    export type Result = PublicBrowser.Load.Result;
  }

  export namespace Chrome {
    export type Mode = {
      readonly name: string;
      readonly headlessArg: string;
    };

    export type Start =
      | {
        readonly ok: true;
        readonly browserWs: string;
        readonly stderr: () => string;
        readonly dispose: () => Promise<void>;
      }
      | { readonly ok: false; readonly summary: string };

    export namespace Cdp {
      export type Client = {
        send<T = Record<string, unknown>>(
          method: string,
          params?: Record<string, unknown>,
          sessionId?: string,
        ): Promise<T>;
        on(handler: (msg: Message) => void): () => void;
        waitFor(method: string, sessionId: string | undefined, timeout: number): Promise<Message>;
        close(): void;
      };

      export type Message = {
        id?: number;
        method?: string;
        params?: unknown;
        result?: unknown;
        error?: { message?: string; data?: string };
        sessionId?: string;
      };
    }
  }
}
