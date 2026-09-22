import type { Files as TFiles } from '@sys/model/files/t';
import type { t } from './common.ts';

/**
 * Cloudflare R2 integration.
 */
export declare namespace R2 {
  /** R2 object access, Files adapters, and application read routes. */
  export type Lib = {
    readonly Service: Service.Lib;
    readonly Files: Files.Lib;
    readonly ReadRoute: ReadRoute.Lib;
    readonly Error: Error.Lib;
  };

  /** Public diagnostics only; never provider messages, URLs, headers, or credential values. */
  export namespace Error {
    export type Lib = {
      /** Recover and revalidate an R2 diagnostic through standard cause/error wrappers. */
      diagnostic(error: unknown): Diagnostic | undefined;
      /** Find a runtime denial without turning it into credential-setup or retry advice. */
      permission(error: unknown): globalThis.Error | undefined;
      /** Format only admitted diagnostic fields, not an upstream error message. */
      format(diagnostic: Diagnostic): string;
    };
    export type Operation = 'stat' | 'read' | 'write' | 'remove' | 'list' | 'presign';
    export type Code =
      | 'AccessDenied'
      | 'InvalidAccessKeyId'
      | 'SignatureDoesNotMatch'
      | 'NoSuchBucket'
      | 'NoSuchKey'
      | 'RequestTimeTooSkewed'
      | 'ExpiredToken'
      | 'InvalidToken'
      | 'SlowDown'
      | 'InternalError'
      | 'ServiceUnavailable'
      | 'InvalidRequest'
      | 'InvalidArgument'
      | 'AuthorizationHeaderMalformed'
      | 'RequestTimeout'
      | 'NotImplemented';
    export type Diagnostic = {
      readonly operation: Operation;
      readonly status?: number;
      readonly code?: Code;
    };
  }

  /** R2 account credentials for signed HTTP access. */
  export type Credentials = {
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
    readonly sessionToken?: string;
  };

  /** R2 service handle. */
  export type Service = {
    readonly accountId: string;
    readonly storageUrl: string;
    bucket(name: string, options?: Bucket.Options): Bucket;
  };

  /**
   * Service constructor surface.
   */
  export namespace Service {
    /** Create an R2 service and resolve its storage endpoint. */
    export type Lib = {
      create(options: CreateOptions): Service;
      storageUrl(accountId: string): string;
    };

    export type CreateOptions = {
      readonly accountId: string;
      readonly credentials: Credentials;
      readonly transport?: Bucket.TransportFactory;
    };
  }

  /** R2 bucket handle. */
  export type Bucket = {
    readonly name: string;
    readonly readOrigin?: string;
    stat(key: string): Promise<ObjectMeta | undefined>;
    read(key: string): Promise<Response>;
    /**
     * Create a temporary URL for downloading one object with GET.
     *
     * Anyone holding the URL can reuse it while it remains valid. Authorize access
     * before issuing it, and keep it out of logs. It does not authorize HEAD.
     *
     * Creating the URL makes no network request and does not check whether the
     * object exists. The built-in transport uses R2's S3 endpoint, not `readOrigin`.
     * Custom transports without signing support leave this method undefined;
     * there is no fallback to the built-in signer.
     *
     * Keys are used exactly as supplied. They must be nonblank, well-formed Unicode
     * strings whose UTF-8 encoding is at most 1,024 bytes. Empty path segments and
     * `.` or `..` segments are rejected, as are control characters, backslash,
     * `?`, and `!'()*`. These restrictions apply only to presigning.
     */
    presignGet?(key: string, options: Bucket.PresignGetOptions): Promise<string>;
    write(
      key: string,
      data: Bucket.Write.Data,
      options?: Bucket.Write.Options,
    ): Promise<Bucket.Write.Result>;
    remove(key: string): Promise<void>;
    list(options?: Bucket.ListOptions): AsyncIterable<ObjectInfo>;
  };

  /**
   * Bucket handle contracts.
   */
  export namespace Bucket {
    export type Options = { readonly readOrigin?: string };

    /** Lifetime chosen by the application for a presigned GET URL. */
    export type PresignGetOptions = {
      /** Required lifetime in whole seconds, from 1 to 604,800 (seven days). */
      expirySeconds: number;
    };

    /**
     * Bucket write contracts.
     */
    export namespace Write {
      /** Writable object payload accepted by bucket writes. */
      export type Data = string | Uint8Array | ReadableStream<Uint8Array>;

      /** Bucket write options. */
      export type Options = {
        readonly mediaType?: string;
        readonly cacheControl?: string;
        readonly contentEncoding?: string;
        readonly size?: number;
        readonly custom?: MetadataCustom;
      };

      /** Object write result. */
      export type Result = {
        readonly etag?: string;
        readonly version?: string;
      };
    }

    export type ListOptions = {
      readonly prefix?: string;
      readonly limit?: number;
      readonly pageSize?: number;
      /**
       * Called before each client-issued listing request, including hidden continuation requests.
       * Throwing refuses dispatch. Custom buckets/transports must honor this hook when supplied.
       * This counts client dispatches, not HTTP redirects, response bytes, or completion time.
       */
      readonly beforeRequest?: () => void;
    };

    export type TransportFactory = (context: TransportContext) => Transport;

    export type TransportContext = {
      readonly accountId: string;
      readonly storageUrl: string;
      readonly credentials: Credentials;
      readonly bucketName: string;
    };

    export type Transport = {
      stat(key: string): Promise<ObjectMeta | undefined>;
      read(key: string): Promise<Response>;
      /**
       * Sign a GET URL without making a network request.
       * The bucket validates the key and expiry, then passes the key unchanged
       * with only `expirySeconds` in the options. Omit this method if unsupported.
       */
      presignGet?(key: string, options: PresignGetOptions): Promise<string>;
      write(key: string, data: Write.Data, options?: Write.Options): Promise<Write.Result>;
      remove(key: string): Promise<void>;
      list(options?: ListOptions): AsyncIterable<ObjectInfo>;
    };
  }

  /**
   * Policy-controlled Files views over an R2 bucket.
   */
  export namespace Files {
    /** Create a writable Files adapter for an R2 bucket. */
    export type Lib = {
      create(options: CreateOptions): Writable;
    };

    /** Bounded writable Files backing over an R2 bucket. */
    export type Writable = TFiles.Backing.Shape<'files/r2:writable'>;

    /** Options for creating a bounded writable Files backing over an R2 bucket. */
    export type CreateOptions =
      & TFiles.Backing.Options
      & TFiles.Backing.InlineReadOptions
      & TFiles.Backing.InlineWriteOptions
      & {
        readonly bucket: Bucket;
        readonly prefix?: string;
        /** Complete per-operation enumeration policy; omitted means finite driver defaults. */
        readonly enumeration?: EnumerationLimits;
      };

    /**
     * Finite enumeration limits, captured at backing construction and renewed per Files command.
     * Objects/keys count every yielded record before filtering; entries/paths bound index growth.
     * These are not SDK XML-buffer, process-memory, network-redirect, or timeout guarantees.
     */
    export type EnumerationLimits = {
      readonly maxRequests: number;
      readonly maxObjects: number;
      readonly maxKeyBytes: number;
      readonly maxEntries: number;
      readonly maxPathBytes: number;
    };

    /**
     * Files/R2 backing error surface.
     */
    export namespace Error {
      /** Files/R2 backing error name. */
      export type Kind =
        | `FilesR2Error.${TFiles.Backing.ErrorKindSuffix}`
        | 'FilesR2Error.EnumerationLimit';
    }
  }

  /**
   * Application HTTP reads from an explicit map of paths to private R2 objects.
   */
  export namespace ReadRoute {
    /** Construct bounded GET/HEAD handlers without starting a server. */
    export type Lib = {
      /**
       * Create a handler with fixed routes, explicit authorization, and read limits.
       * The bucket must support `presignGet`. Construction captures the route map,
       * limits, callback, and signer; invalid configuration throws.
       */
      create(options: CreateOptions): Handler;
      /** Fetch and verify a pinned `dist.json`, then construct a read handler. */
      fromDist(args: FromDist.Args): Promise<FromDist.Result>;
    };

    /**
     * Verify `dist.json` against its expected checksum, then construct read routes.
     * Files served by the handler are not checked against the manifest's file hashes.
     */
    export namespace FromDist {
      /**
       * Inputs for fetching a pinned manifest and constructing its read handler.
       * Storage settings, limits, and callbacks are captured before signing or route selection.
       */
      export type Args = Omit<CreateOptions, 'routes'> & {
        /** Unchanged object-key prefix; use an empty string for the bucket root. */
        prefix: string;
        /**
         * Expected SHA-256 of the complete `dist.json` bytes, not its embedded `hash.digest`.
         * Obtain this pin independently of the manifest download.
         */
        pin: t.DistPin;
        /** Limits for downloading and validating the manifest, separate from response limits. */
        manifestLimits: t.FsPkg.Dist.Pinned.AdmitManifest.Limits;
        routes: Routes;
        /**
         * Cancel handler construction. After `ready`, each request uses its own signal.
         * Requires a native AbortSignal; duck-typed signals and proxies are invalid input.
         */
        signal?: AbortSignal;
      };

      /**
       * Select routes synchronously, without IO, from immutable verified metadata.
       * Map encoded URL paths → filenames in `dist.hash.parts`, without adding `prefix`.
       * `dist.json` may also be selected. Return a plain data map; unknown filenames,
       * accessors, and async results are refused. One invalid entry rejects the whole map.
       *
       * For async results, the driver attaches a rejection handler only to same-realm
       * base Promises with no own properties and unchanged native constructor/species.
       * The callback must handle rejections for all other async results. The driver does not
       * call their `then` methods, invoke their getters, or modify them to attach a handler.
       */
      export type Routes = (dist: t.DeepReadonly<t.DistPkg>) => Readonly<Record<string, string>>;

      /** Only `ready` exposes a handler; failures contain no provider or callback details. */
      export type Result = Ready | Failure;
      export type Ready = { readonly kind: 'ready'; readonly handler: Handler };

      /**
       * No handler is returned. Cancellation covers the entire construction call.
       * Timeout covers signing and reading the manifest, not verification or route selection.
       * The call may return before pending work and cleanup finish.
       */
      export type Failure =
        | { readonly kind: 'invalid-input' }
        /** Driver status: 404 not found, 413 too large, 502 signing or upstream failure. */
        | { readonly kind: 'read-refused'; readonly status: 404 | 413 | 502 }
        /** Manifest verification failed; `reason` identifies the failed check. */
        | {
          readonly kind: 'manifest-refused';
          readonly reason: Exclude<t.FsPkg.Dist.Pinned.AdmitManifest.FailureKind, 'cancelled'>;
        }
        /** The route policy threw or returned an invalid map. */
        | { readonly kind: 'policy-refused' }
        | { readonly kind: 'cancelled' }
        | { readonly kind: 'timeout' };
    }

    /**
     * Serve a mapped object after authorization.
     *
     * GET and HEAD share a bounded, buffered read; HEAD omits the body. MIME comes
     * from the object filename, length from decoded bytes. Every response uses
     * `no-store` and `nosniff`; provider headers and error details are not forwarded.
     *
     * Failures have empty bodies:
     * - Request: 400 malformed path or query, 405 unsupported method, 416 Range.
     * - Authorization: 403 denied, 500 callback failure.
     * - Object: 404 unmapped or missing, 502 signing or upstream failure.
     * - Capacity: 413 object too large, 503 all read slots occupied.
     * - Cancellation: 499 caller abort, 504 deadline expired.
     */
    export type Handler = (req: Request) => Promise<Response>;

    /** Application-owned routing, authorization, and resource budgets. */
    export type CreateOptions = {
      bucket: Pick<Bucket, 'name' | 'presignGet'>;
      /** Exact R2 S3 origin from Service.storageUrl; never the public readOrigin. */
      storageOrigin: string;
      /**
       * Exact encoded path → unchanged object key; no query strings or fallbacks.
       * Use `/` for root. For other routes, prepend `/` to a presigning-compatible
       * key with each segment encoded by `encodeURIComponent`.
       */
      routes: Readonly<Record<string, string>>;
      /** Required even for anonymous access, which must explicitly return true. */
      authorize: Authorize;
      limits: Limits;
    };

    /** Authorize the selected object; only `true` permits storage work. */
    export type Authorize = (args: AuthorizeArgs) => boolean | Promise<boolean>;

    /** Request and selected object passed to authorization. */
    export type AuthorizeArgs = {
      req: Request;
      key: string;
      /** Covers caller cancellation and the deadline. */
      signal: AbortSignal;
    };

    /**
     * Object-size, deadline, and concurrency limits for one handler instance.
     * All are required positive safe integers, captured at construction.
     *
     * These are not process-memory or deployment-wide traffic limits. Transport
     * buffers and byte copies need additional headroom; returned responses can
     * outlive their read slots.
     */
    export type Limits = {
      /** Maximum decoded object size in bytes. */
      maxBytes: number;
      /** Milliseconds from request admission through response creation; at most seven days. */
      timeout: number;
      /**
       * Maximum active operations, from authorization through response creation.
       * Excess requests are refused, not queued. Timeout or cancellation retains
       * the slot until pending work and body cleanup settle; a dependency that
       * never settles can exhaust capacity.
       */
      maxConcurrent: number;
    };
  }

  /** Content headers and custom metadata associated with an object. */
  export type ObjectMetadata = {
    readonly mediaType?: string;
    readonly cacheControl?: string;
    readonly contentEncoding?: string;
    readonly custom?: MetadataCustom;
  };

  /** Custom object metadata as string key-value pairs. */
  export type MetadataCustom = Readonly<Record<string, string>>;

  /** Object key, size, and optional metadata returned by the transport. */
  export type ObjectInfo = {
    readonly key: string;
    readonly size: number;
    readonly etag?: string;
    readonly modifiedAt?: Date;
  };

  /** Object stat result. */
  export type ObjectMeta = ObjectInfo & {
    readonly version?: string;
    readonly metadata?: ObjectMetadata;
  };
}
