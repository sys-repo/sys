import type * as J from './m.jsr/t.ts';
import type * as N from './m.npm/t.ts';

/**
 * @module types
 */
export declare namespace Registry {
  export namespace Jsr {
    export namespace Client {
      export type Lib = J.JsrClient.Lib;
    }

    export namespace Server {
      export type Lib = J.JsrServer.Lib;
    }

    export namespace Import {
      export type Lib = J.JsrImport.Lib;
    }

    export namespace Url {
      export type Lib = J.JsrUrl.Lib;

      export namespace Pkg {
        export type Lib = J.JsrUrl.Pkg.Lib;
      }
    }

    export namespace Manifest {
      export type Lib = J.JsrManifest.Lib;
      export type Instance = J.JsrManifest.Instance;

      export namespace Fetch {
        export type Response = J.JsrManifest.Fetch.Response;
        export type Success = J.JsrManifest.Fetch.Success;
        export type Fail = J.JsrManifest.Fetch.Fail;
      }

      export namespace Pull {
        export type Options = J.JsrManifest.Pull.Options;
        export type Response = J.JsrManifest.Pull.Response;
      }
    }

    export namespace Fetch {
      export type Lib = J.JsrFetch.Lib;

      export namespace Pkg {
        export type Lib = J.JsrFetch.Pkg.Lib;
        export type Options = J.JsrFetch.Pkg.Options;
        export type ChecksumOptions = J.JsrFetch.Pkg.ChecksumOptions;
        export type VersionsResponse = J.JsrFetch.Pkg.VersionsResponse;
        export type InfoResponse = J.JsrFetch.Pkg.InfoResponse;
        export type FileResponse = J.JsrFetch.Pkg.FileResponse;
        export type MetaVersions = J.JsrFetch.Pkg.MetaVersions;
        export type MetaVersion = J.JsrFetch.Pkg.MetaVersion;
        export type VersionInfo = J.JsrFetch.Pkg.VersionInfo;
        export type Graph = J.JsrFetch.Pkg.Graph;
        export type GraphModule = J.JsrFetch.Pkg.GraphModule;
        export type GraphDependency = J.JsrFetch.Pkg.GraphDependency;
        export type Manifest = J.JsrFetch.Pkg.Manifest;
        export type ManifestFile = J.JsrFetch.Pkg.ManifestFile;
        export type FileFetcher = J.JsrFetch.Pkg.FileFetcher;
      }
    }
  }

  export namespace Npm {
    export namespace Client {
      export type Lib = N.NpmClient.Lib;
    }

    export namespace Server {
      export type Lib = N.NpmServer.Lib;
    }

    export namespace Import {
      export type Lib = N.NpmImport.Lib;
    }

    export namespace Url {
      export type Lib = N.NpmFetch.Url.Lib;

      export namespace Pkg {
        export type Lib = N.NpmFetch.Url.Pkg.Lib;
      }
    }

    export namespace Fetch {
      export type Lib = N.NpmFetch.Lib;

      export namespace Pkg {
        export type Lib = N.NpmFetch.Pkg.Lib;
        export type Options = N.NpmFetch.Pkg.Options;
        export type VersionsResponse = N.NpmFetch.Pkg.VersionsResponse;
        export type InfoResponse = N.NpmFetch.Pkg.InfoResponse;
        export type MetaVersions = N.NpmFetch.Pkg.MetaVersions;
        export type MetaVersion = N.NpmFetch.Pkg.MetaVersion;
        export type VersionInfo = N.NpmFetch.Pkg.VersionInfo;
        export type DistInfo = N.NpmFetch.Pkg.DistInfo;
      }
    }
  }
}
