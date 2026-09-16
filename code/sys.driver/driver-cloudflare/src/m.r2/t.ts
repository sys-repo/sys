import type { Files as TFiles } from '@sys/model/files/t';

/**
 * Cloudflare R2 integration.
 */
export declare namespace R2 {
  /**
   * R2 service construction and Files adapters.
   */
  export type Lib = {
    readonly Service: Service.Lib;
    readonly Files: Files.Lib;
  };

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
    /**
     * Create an R2 service and resolve its storage endpoint.
     */
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
   * Files<T> backing adapter over an R2 bucket.
   */
  export namespace Files {
    /**
     * Create a writable Files adapter for an R2 bucket.
     */
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
