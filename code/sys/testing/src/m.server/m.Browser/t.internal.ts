import type { Process as TProcess } from '@sys/process/t';
import type { t } from '../../common.ts';
import type { Browser as PublicBrowser } from './t.ts';

export type * from '../../common/t.ts';

/**
 * Internal Browser implementation contracts.
 */
export declare namespace Browser {
  export type Lib = PublicBrowser.Lib;
  export type Kind = PublicBrowser.Kind;

  /**
   * Single-navigation browser assertion contracts.
   */
  export namespace Load {
    export type Options = PublicBrowser.Load.Options;
    export type Result = PublicBrowser.Load.Result;
  }

  /**
   * Isolated Service Worker lifecycle observation contracts.
   */
  export namespace ServiceWorker {
    export type Lib = PublicBrowser.ServiceWorker.Lib;

    /**
     * Scenario input and result contracts.
     */
    export namespace Scenario {
      export type Options = PublicBrowser.ServiceWorker.Scenario.Options;
      export type Result = PublicBrowser.ServiceWorker.Scenario.Result;
    }

    export type Step = PublicBrowser.ServiceWorker.Step;

    /**
     * Ordered browser actions and their evidence.
     */
    export namespace Step {
      export type Navigate = PublicBrowser.ServiceWorker.Step.Navigate;
      export type Reload = PublicBrowser.ServiceWorker.Step.Reload;
      export type Update = PublicBrowser.ServiceWorker.Step.Update;
      export type Observe = PublicBrowser.ServiceWorker.Step.Observe;
      export type Result = PublicBrowser.ServiceWorker.Step.Result;
      export type Outcome = PublicBrowser.ServiceWorker.Step.Outcome;
    }

    export type Expectation = PublicBrowser.ServiceWorker.Expectation;

    /**
     * Fixed assertions over one Service Worker observation.
     */
    export namespace Expectation {
      export type Registrations = PublicBrowser.ServiceWorker.Expectation.Registrations;
      export type Controller = PublicBrowser.ServiceWorker.Expectation.Controller;
      export type Cache = PublicBrowser.ServiceWorker.Expectation.Cache;
      export type Registration = PublicBrowser.ServiceWorker.Expectation.Registration;
      export type Worker = PublicBrowser.ServiceWorker.Expectation.Worker;
    }

    export type Observation = PublicBrowser.ServiceWorker.Observation;
    export type Registration = PublicBrowser.ServiceWorker.Registration;
    export type Worker = PublicBrowser.ServiceWorker.Worker;

    /**
     * Service Worker contracts.
     */
    export namespace Worker {
      export type State = PublicBrowser.ServiceWorker.Worker.State;
    }

    export type Diagnostics = PublicBrowser.ServiceWorker.Diagnostics;

    /**
     * Browser diagnostic contracts.
     */
    export namespace Diagnostics {
      export type Entry = PublicBrowser.ServiceWorker.Diagnostics.Entry;
    }
  }

  /**
   * Internal Chrome process and DevTools Protocol contracts.
   */
  export namespace Chrome {
    /** One isolated Chrome session with an attached CDP client. */
    export type Session = {
      readonly executablePath: t.StringAbsolutePath;
      readonly mode: Start.Mode['name'];
      readonly cdp: Cdp.Client;
      readonly stderr: () => string;
      readonly close: (primary?: unknown) => Promise<void>;
    };

    /**
     * Chrome startup contracts.
     */
    export namespace Start {
      /** Result of one Chrome process start attempt. */
      export type Result = Started | Failure;

      /** Injectable startup operations used by deterministic lifecycle tests. */
      export type Deps = {
        readonly makeProfile?: () => Promise<t.StringAbsolutePath>;
        readonly spawn?: (args: {
          readonly executablePath: string;
          readonly args: readonly string[];
          readonly clearEnv: true;
          readonly env: Readonly<Record<string, string>>;
        }) => Pick<TProcess.Handle, 'dispose' | 'onStdErr' | 'onStdOut'>;
        readonly removeProfile?: (path: t.StringAbsolutePath) => Promise<unknown>;
        readonly startTimeout?: t.Msecs;
        readonly devtoolsUrl?: t.StringUrl;
        readonly closeTimeout?: t.Msecs;
        readonly profileRemoveTimeout?: t.Msecs;
      };

      /** Started Chrome process awaiting CDP attachment. */
      export type Started = {
        readonly ok: true;
        readonly browserWs: t.StringUrl;
        /** Internal profile marker retained only until cleanup proof. */
        readonly profilePath: t.StringAbsolutePath;
        readonly stderr: () => string;
        readonly close: () => Promise<readonly Cleanup.Failure[]>;
      };

      /** Sanitized startup failure with cleanup evidence. */
      export type Failure = {
        readonly ok: false;
        readonly mode: string;
        readonly error: string;
        readonly cleanup: readonly Cleanup.Failure[];
      };

      /** One supported Chrome launch mode. */
      export type Mode = {
        readonly name: string;
        readonly headlessArg: string;
      };
    }

    /**
     * Chrome resource-cleanup contracts.
     */
    export namespace Cleanup {
      /** One bounded cleanup failure. */
      export type Failure = {
        readonly stage: 'browser-close' | 'process-close' | 'profile-remove';
        readonly error: string;
        /** True only when this failure leaves browser/profile ownership unresolved. */
        readonly unresolved: boolean;
      };
    }

    /**
     * Internal Chrome DevTools Protocol contracts.
     */
    export namespace Cdp {
      /** Connect to one CDP WebSocket endpoint within an optional timeout. */
      export type Connect = (url: t.StringUrl, timeout?: t.Msecs) => Promise<Client>;

      /** Minimal protocol client consumed by fixed target helpers. */
      export type ProtocolClient = Pick<Client, 'send' | 'on' | 'waitFor'>;

      /** Active CDP command and event client. */
      export type Client = {
        send<T = Record<string, unknown>>(
          method: string,
          params?: Record<string, unknown>,
          sessionId?: string,
          timeout?: t.Msecs,
        ): Promise<T>;
        on(handler: (msg: Message) => void): () => void;
        waitFor(
          method: string,
          sessionId: string | undefined,
          timeout: t.Msecs,
          predicate?: (message: Message) => boolean,
        ): Waiter;
        close(): void;
      };

      /** One cancellable CDP event waiter. */
      export type Waiter = Promise<Message> & { readonly cancel: () => void };

      /** One CDP event or command response. */
      export type Message = {
        id?: number;
        method?: string;
        params?: unknown;
        result?: unknown;
        error?: { message?: string; data?: string };
        sessionId?: string;
      };

      /**
       * Runtime evaluation wire contracts.
       */
      export namespace Evaluate {
        /** By-value response from one fixed internal runtime evaluation. */
        export type Response = {
          readonly result: { readonly value?: unknown; readonly description?: string };
          readonly exceptionDetails?: {
            readonly text?: string;
            readonly exception?: { readonly description?: string };
          };
        };
      }
    }
  }
}
