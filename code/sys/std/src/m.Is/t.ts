import type { t } from '../common.ts';

/**
 * Boolean predicates and type guards.
 */
export declare namespace Is {
  /**
   * Universal predicate surface.
   */
  export type Lib = {
    /** True for `false`, `0`, `0n`, `NaN`, the empty string, `null`, or `undefined`. */
    falsy(input?: unknown): input is t.Falsy | typeof NaN;

    /** True only for `null` or `undefined`. */
    nil(input?: unknown): input is null | undefined;

    /**
     * True for objects with callable `dispose` and `[Symbol.dispose]` methods whose
     * `[Symbol.asyncDispose]` value is `undefined`.
     */
    disposable(input?: unknown): input is t.Disposable;

    /**
     * True for objects with boolean `disposed` state, observable `dispose$`, and no
     * `[Symbol.asyncDispose]` property on the object or its prototype chain.
     */
    lifecycleView(input?: unknown): input is t.LifecycleView;

    /** True for non-null objects with a callable `dispose` method. */
    disposableLike(input?: unknown): input is t.DisposableLike;

    /** True for non-null objects or functions with a callable `then` property. */
    promise<T = unknown>(input?: unknown): input is PromiseLike<T>;

    /** True for symbols. */
    symbol(input?: unknown): input is symbol;

    /** True for non-array objects with a Promise-like `finished` property. */
    waitableHandle(input?: unknown): input is t.WaitableHandle;

    /** True for non-null objects with callable `subscribe` and `next` methods. */
    subject<T = unknown>(input?: any): input is t.Subject<T>;

    /** True for non-null objects with a callable `subscribe` method. */
    observable<T = unknown>(input?: any): input is t.Observable<T>;

    /** True for `Error` instances recognized by the current realm. */
    error: t.Err.Is.Lib['error'];

    /** True for `Error` instances or non-array objects with a string `message` property. */
    errorLike: t.Err.Is.Lib['errorLike'];

    /**
     * True for non-array objects that are not current-realm `Error` instances and have string `name`
     * and `message` properties plus an optional recursively valid `cause`.
     */
    stdError: t.Err.Is.Lib['stdError'];

    /** True for finite numbers, bigint values, or non-blank strings that convert to finite numbers. */
    numeric(input?: unknown): boolean;

    /** True when a trimmed string begins with `{` or `[`. The content is not parsed or validated. */
    json(input?: unknown): input is t.Json;

    /**
     * True when `Object.prototype.toString` reports `[object ArrayBuffer]` or
     * `[object SharedArrayBuffer]`.
     */
    arrayBufferLike(input?: unknown): input is ArrayBufferLike;

    /**
     * True when `ArrayBuffer.isView` accepts the value and the intrinsic typed-array tag identifies
     * a `Uint8Array`.
     */
    uint8Array(input?: unknown): input is Uint8Array;

    /**
     * True for `null`, `undefined`, whitespace-only strings, or arrays whose every element is blank.
     */
    blank(value?: unknown): boolean;

    /**
     * True for objects with `tcp` or `udp` transport, a string hostname, and a number-valued port.
     */
    netaddr(input: unknown): input is Deno.NetAddr;

    /** True when the status code's string form begins with `2`. */
    statusOK(status: number): boolean;

    /** True when the input or any nested `cause` carries the given HTTP status code. */
    httpStatus(input: unknown, status: t.HttpStatusCode): boolean;

    /**
     * True when the internal browser mock is active, or when `navigator.userAgent` is a string and
     * no Deno runtime is detected.
     */
    browser(): boolean;

    /**
     * True when the global constructor is named `DedicatedWorkerGlobalScope`,
     * `SharedWorkerGlobalScope`, or `ServiceWorkerGlobalScope`.
     */
    worker(): boolean;

    /** True for non-null values whose `typeof` is `object`. */
    object(input?: unknown): input is object;

    /** True for non-null, non-array objects; prototypes are unrestricted. */
    record<T extends O>(input?: unknown): input is T;

    /** True for records with no own enumerable string keys. */
    emptyRecord<T extends O>(input?: unknown): input is T;

    /**
     * True for values tagged `[object Object]` whose prototype is this realm's `Object.prototype`
     * or `null`.
     */
    plainObject(input?: unknown): input is Record<PropertyKey, unknown>;

    /** True for values tagged `[object Object]` whose prototype is `null`. */
    plainRecord(input?: unknown): input is Record<PropertyKey, unknown>;

    /** True for functions. */
    func(input?: unknown): input is Function;

    /** True for boolean values. */
    bool(input?: unknown): input is boolean;

    /** True for strings. */
    string(input?: unknown): input is string;

    /** Alias of `string`. */
    str(input?: unknown): input is string;

    /** True for numbers other than `NaN`. */
    number(input?: unknown): input is number;

    /** Alias of `number`. */
    num(input?: unknown): input is number;

    /** True for arrays. */
    array<T>(input?: unknown): input is T[];

    /**
     * True when an absolute URL string or location object has hostname `localhost`, `127.0.0.1`,
     * `::1`, or `[::1]`. With no argument, reads `window.location.hostname` after `browser()` passes,
     * so a window-like global is required.
     */
    localhost(value?: string | Location): boolean;

    /** True for arrays containing only string or number path segments. */
    objectPath(input?: unknown): input is t.ObjectPath;

    /**
     * True for objects with boolean `aborted` state and callable `addEventListener` and
     * `removeEventListener` methods.
     */
    abortSignal(input?: unknown): input is AbortSignal;

    /** True for objects with a callable `abort` method and a `signal` accepted by `abortSignal`. */
    abortController(input?: unknown): input is AbortController;

    /**
     * True for lifecycle views, observables, abort signals, or arrays recursively containing only
     * those values.
     */
    until(input?: unknown): input is t.Until;

    /** True for `undefined`, any `Until`, or arrays recursively containing either. */
    untilInput(input?: unknown): input is t.UntilInput;

    /**
     * True for non-null objects with callable `send`, `close`, and `addEventListener` methods.
     */
    websocket(input?: unknown): input is WebSocket;

    /**
     * True for `URL` instances or non-array objects with a string `href` property or callable
     * `toURL` method.
     */
    urlLike(input?: unknown): input is t.UrlLike;

    /** True when a string begins with an HTTP or HTTPS scheme and parses as an absolute URL. */
    urlString(input: unknown): input is t.StringUrl;
  };

  /**
   * Deno and Node extension of the universal predicate surface, backed by `node:util.types`.
   *
   * `Server` marks a runtime capability boundary, not network authority. The implementation
   * captures the host classifier functions as the module evaluates. Each must still be the original
   * host function at that moment. Later replacement of properties on `node:util.types` cannot
   * redirect the captured predicates.
   *
   * The host classifiers read no properties from the tested value and invoke no userland Proxy
   * traps. A positive result establishes only the identity recognized by the captured classifier,
   * not provenance, ownership, trust, or safety for later operations.
   *
   * Browsers expose no equivalent Proxy classifier, so this namespace is absent from `Is.Lib`.
   */
  export namespace Server {
    /**
     * Universal predicates plus captured Deno and Node identity classifiers.
     */
    export type Lib = Is.Lib & {
      /** Host identity classifiers captured when the server module evaluates. */
      readonly Native: Native.Lib;
    };

    /**
     * Identity predicates captured from `node:util.types` at module evaluation. The runtime
     * namespace is frozen.
     */
    export namespace Native {
      /**
       * Captured host identity predicate surface.
       */
      export type Lib = {
        /**
         * True when the captured host classifier identifies a live or revoked Proxy without
         * invoking its traps.
         */
        proxy(input?: unknown): boolean;

        /** True when the captured host classifier recognizes the value as a Promise. */
        promise(input?: unknown): input is Promise<unknown>;

        /** True when the captured host classifier recognizes the value as a native Error. */
        error(input?: unknown): input is Error;

        /** True when the captured host classifier recognizes a `Uint8Array`. */
        uint8Array(input?: unknown): input is Uint8Array;

        /** True when the captured host classifier recognizes a `SharedArrayBuffer`. */
        sharedArrayBuffer(input?: unknown): input is SharedArrayBuffer;
      };
    }
  }
}

type O = Record<string, unknown>;
