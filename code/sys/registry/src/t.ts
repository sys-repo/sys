import type * as J from './m.jsr/t.ts';
import type * as N from './m.npm/t.ts';

/**
 * @module types
 */
export declare namespace Registry {
  export namespace Jsr {
    export type ClientLib = J.JsrClientLib;
    export type ServerLib = J.JsrServerLib;
    export type ImportLib = J.JsrImportLib;
    export type UrlLib = J.JsrUrlLib;
    export type UrlPkgLib = J.JsrUrlPkgLib;
    export type ManifestLib = J.JsrManifestLib;
    export type Manifest = J.JsrManifest;
    export type ManifestFetchResponse = J.JsrManifestFetchResponse;
    export type ManifestPullOptions = J.JsrManifestPullOptions;
    export type ManifestPullResponse = J.JsrManifestPullResponse;

    export namespace Fetch {
      export type Lib = J.JsrFetchLib;
      export type PkgLib = J.JsrFetchPkgLib;
      export type PkgOptions = J.JsrFetchPkgOptions;
      export type PkgChecksumOptions = J.JsrFetchPkgChecksumOptions;
      export type PkgVersionsResponse = J.JsrFetchPkgVersionsResponse;
      export type PkgInfoResponse = J.JsrFetchPkgInfoResponse;
      export type PkgFileResponse = J.JsrFetchPkgFileResponse;
      export type PkgMetaVersions = J.JsrPkgMetaVersions;
      export type PkgMetaVersion = J.JsrPkgMetaVersion;
      export type PkgVersionInfo = J.JsrPkgVersionInfo;
      export type PkgManifest = J.JsrPkgManifest;
      export type PkgManifestFile = J.JsrPkgManifestFile;
      export type PkgFileFetcher = J.JsrPkgFileFetcher;
    }
  }

  export namespace Npm {
    export type ClientLib = N.NpmClientLib;
    export type ServerLib = N.NpmServerLib;
    export type ImportLib = N.NpmImportLib;
    export type UrlLib = N.NpmUrlLib;
    export type UrlPkgLib = N.NpmUrlPkgLib;

    export namespace Fetch {
      export type Lib = N.NpmFetchLib;
      export type PkgLib = N.NpmFetchPkgLib;
      export type PkgOptions = N.NpmFetchPkgOptions;
      export type PkgVersionsResponse = N.NpmFetchPkgVersionsResponse;
      export type PkgInfoResponse = N.NpmFetchPkgInfoResponse;
      export type PkgMetaVersions = N.NpmPkgMetaVersions;
      export type PkgMetaVersion = N.NpmPkgMetaVersion;
      export type PkgVersionInfo = N.NpmPkgVersionInfo;
      export type PkgDistInfo = N.NpmPkgDistInfo;
    }
  }
}
