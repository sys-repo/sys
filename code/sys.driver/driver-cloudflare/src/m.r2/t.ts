/**
 * Cloudflare R2 integration.
 */
export declare namespace R2 {
  /** Runtime API surface. */
  export type Lib = {
    readonly Service: Service.Lib;
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
    /** Runtime API surface. */
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
      write(key: string, data: Write.Data, options?: Write.Options): Promise<Write.Result>;
      remove(key: string): Promise<void>;
      list(options?: ListOptions): AsyncIterable<ObjectInfo>;
    };
  }

  /** Object metadata using R2/public-driver vocabulary. */
  export type ObjectMetadata = {
    readonly mediaType?: string;
    readonly cacheControl?: string;
    readonly contentEncoding?: string;
    readonly custom?: MetadataCustom;
  };

  /** Provider/user metadata fields. */
  export type MetadataCustom = Readonly<Record<string, string>>;

  /** Object identity from provider truth. */
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
