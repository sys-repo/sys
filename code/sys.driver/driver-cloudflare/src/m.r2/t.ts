import type { Files as TFiles } from '@sys/model/files/t';

/**
 * Cloudflare R2 integration.
 */
export declare namespace R2 {
  /** Runtime API surface. */
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

  /**
   * Files<T> backing adapter over an R2 bucket.
   */
  export namespace Files {
    /** Runtime API surface. */
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
      };

    /** Files/R2 backing error surface. */
    export namespace Error {
      /** Files/R2 backing error name. */
      export type Kind = `FilesR2Error.${TFiles.Backing.ErrorKindSuffix}`;
    }
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
