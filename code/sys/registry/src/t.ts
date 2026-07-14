import type * as J from './m.jsr/t.ts';
import type * as N from './m.npm/t.ts';

/**
 * @module types
 */
export declare namespace Registry {
  /** JSR registry helper aliases. */
  export namespace Jsr {
    /** JSR client helper aliases. */
    export namespace Client {
      /** JSR client helper library surface. */
      export type Lib = J.JsrClient.Lib;
    }

    /** JSR server helper aliases. */
    export namespace Server {
      /** JSR server helper library surface. */
      export type Lib = J.JsrServer.Lib;
    }

    /** JSR import-specifier helper aliases. */
    export namespace Import {
      /** JSR import-specifier helper library surface. */
      export type Lib = J.JsrImport.Lib;
    }

    /** JSR URL helper aliases. */
    export namespace Url {
      /** JSR URL helper library surface. */
      export type Lib = J.JsrUrl.Lib;

      /** JSR package URL helper aliases. */
      export namespace Pkg {
        /** JSR package URL helper library surface. */
        export type Lib = J.JsrUrl.Pkg.Lib;
      }
    }

    /** JSR source manifest helper aliases. */
    export namespace Manifest {
      /** JSR manifest helper library surface. */
      export type Lib = J.JsrManifest.Lib;
      /** JSR manifest instance. */
      export type Instance = J.JsrManifest.Instance;

      /** JSR manifest fetch aliases. */
      export namespace Fetch {
        /** Manifest fetch response. */
        export type Response = J.JsrManifest.Fetch.Response;
        /** Successful manifest fetch response. */
        export type Success = J.JsrManifest.Fetch.Success;
        /** Failed manifest fetch response. */
        export type Fail = J.JsrManifest.Fetch.Fail;
      }

      /** JSR manifest pull aliases. */
      export namespace Pull {
        /** Manifest pull options. */
        export type Options = J.JsrManifest.Pull.Options;
        /** Manifest pull response. */
        export type Response = J.JsrManifest.Pull.Response;
      }
    }

    /** JSR fetch helper aliases. */
    export namespace Fetch {
      /** JSR fetch helper library surface. */
      export type Lib = J.JsrFetch.Lib;

      /** JSR package fetch aliases. */
      export namespace Pkg {
        /** Package-scoped JSR fetch helper surface. */
        export type Lib = J.JsrFetch.Pkg.Lib;
        /** Package fetch options. */
        export type Options = J.JsrFetch.Pkg.Options;
        /** Package fetch checksum options. */
        export type ChecksumOptions = J.JsrFetch.Pkg.ChecksumOptions;
        /** Package versions response. */
        export type VersionsResponse = J.JsrFetch.Pkg.VersionsResponse;
        /** Package version info response. */
        export type InfoResponse = J.JsrFetch.Pkg.InfoResponse;
        /** Package file fetch response. */
        export type FileResponse = J.JsrFetch.Pkg.FileResponse;
        /** Package version metadata response body. */
        export type MetaVersions = J.JsrFetch.Pkg.MetaVersions;
        /** Single package version metadata entry. */
        export type MetaVersion = J.JsrFetch.Pkg.MetaVersion;
        /** Package version info response body. */
        export type VersionInfo = J.JsrFetch.Pkg.VersionInfo;
        /** Normalized package module graph. */
        export type Graph = J.JsrFetch.Pkg.Graph;
        /** Normalized package graph module. */
        export type GraphModule = J.JsrFetch.Pkg.GraphModule;
        /** Normalized package graph dependency. */
        export type GraphDependency = J.JsrFetch.Pkg.GraphDependency;
        /** Package source manifest. */
        export type Manifest = J.JsrFetch.Pkg.Manifest;
        /** Package source manifest entry. */
        export type ManifestFile = J.JsrFetch.Pkg.ManifestFile;
        /** Version-bound package file fetcher. */
        export type FileFetcher = J.JsrFetch.Pkg.FileFetcher;
      }
    }
  }

  /** npm registry helper aliases. */
  export namespace Npm {
    /** npm client helper aliases. */
    export namespace Client {
      /** npm client helper library surface. */
      export type Lib = N.NpmClient.Lib;
    }

    /** npm server helper aliases. */
    export namespace Server {
      /** npm server helper library surface. */
      export type Lib = N.NpmServer.Lib;
    }

    /** npm import-specifier helper aliases. */
    export namespace Import {
      /** npm import-specifier helper library surface. */
      export type Lib = N.NpmImport.Lib;
    }

    /** npm URL helper aliases. */
    export namespace Url {
      /** npm URL helper library surface. */
      export type Lib = N.NpmFetch.Url.Lib;

      /** npm package URL helper aliases. */
      export namespace Pkg {
        /** npm package URL helper library surface. */
        export type Lib = N.NpmFetch.Url.Pkg.Lib;
      }
    }

    /** npm fetch helper aliases. */
    export namespace Fetch {
      /** npm fetch helper library surface. */
      export type Lib = N.NpmFetch.Lib;

      /** npm package fetch aliases. */
      export namespace Pkg {
        /** Package-scoped npm fetch helper surface. */
        export type Lib = N.NpmFetch.Pkg.Lib;
        /** Package fetch options. */
        export type Options = N.NpmFetch.Pkg.Options;
        /** Package versions response. */
        export type VersionsResponse = N.NpmFetch.Pkg.VersionsResponse;
        /** Package version info response. */
        export type InfoResponse = N.NpmFetch.Pkg.InfoResponse;
        /** Package version metadata response body. */
        export type MetaVersions = N.NpmFetch.Pkg.MetaVersions;
        /** Single package version metadata entry. */
        export type MetaVersion = N.NpmFetch.Pkg.MetaVersion;
        /** Package version info response body. */
        export type VersionInfo = N.NpmFetch.Pkg.VersionInfo;
        /** npm distribution metadata. */
        export type DistInfo = N.NpmFetch.Pkg.DistInfo;
      }
    }
  }
}
