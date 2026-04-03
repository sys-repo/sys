import type { t } from './common.ts';

/**
 * Local Deno-addressable workspace graph and package-order helpers.
 *
 * Scope:
 * - collects graph truth for workspace packages that are addressable through
 *   local Deno module graph collection
 * - derives package dependency edges and deterministic package ordering from
 *   that local module graph
 *
 * Non-goals:
 * - modeling every possible workspace member kind
 * - exposing raw `deno info --json` data as part of the public contract
 * - baking target-root package selection into the derived package graph
 */
export declare namespace WorkspaceGraph {
  /** Local workspace graph helper surface. */
  export type Lib = {
    /** Collect normalized local Deno-addressable workspace module-graph truth. */
    collect(args: CollectArgs): Promise<LocalModuleGraph>;
    /** Collapse local module imports into package dependency edges. */
    packageEdges(graph: LocalModuleGraph): PackageGraph;
    /** Order packages deterministically via `@sys/esm` topological planning. */
    order(graph: PackageGraph): PackageOrderResult;
    /** Persisted graph snapshot helpers. */
    readonly Snapshot: Snapshot.Lib;
  };

  /** Package manifest discovery source for local graph collection. */
  export type PackageSource = {
    /** Include globs used to discover package manifests. */
    readonly include: readonly t.StringPath[];
  };

  /** Arguments for local graph collection. */
  export type CollectArgs = {
    /** Working directory used to resolve package discovery globs. */
    readonly cwd?: t.StringDir;
    /** Package manifest discovery globs. */
    readonly source: PackageSource;
  };

  /** One discovered local workspace package. */
  export type Package = {
    /**
     * Canonical package identity for local workspace graphing.
     * This is the normalized workspace-relative package path.
     */
    readonly path: t.StringPath;
    /** Workspace-relative manifest path. */
    readonly manifestPath: t.StringPath;
    /** Package name from `deno.json` when present. */
    readonly name?: string;
    /** Entry module paths used to seed local graph collection. */
    readonly entryPaths: readonly t.StringPath[];
  };

  /** One normalized local module owned by a workspace package. */
  export type Module = {
    /**
     * Canonical module identity for local workspace graphing.
     * This is the normalized workspace-relative module path.
     */
    readonly key: t.StringPath;
    /** Owning package path. */
    readonly packagePath: Package['path'];
  };

  /** Local module import edge kind. */
  export type ModuleEdgeKind = 'code' | 'type';

  /** Directed local module import edge. */
  export type ModuleEdge = {
    /** Importing module key. */
    readonly from: Module['key'];
    /** Imported module key. */
    readonly to: Module['key'];
    /** Import edge kind. */
    readonly kind: ModuleEdgeKind;
  };

  /** Normalized local module graph rooted in local Deno-addressable workspace packages. */
  export type LocalModuleGraph = {
    /** Working directory used as the normalization anchor. */
    readonly cwd: t.StringDir;
    /** Discovered workspace packages. */
    readonly packages: readonly Package[];
    /** Root module keys passed to collection. */
    readonly roots: readonly Module['key'][];
    /** Normalized local modules. */
    readonly modules: readonly Module[];
    /** Directed local module import edges. */
    readonly edges: readonly ModuleEdge[];
  };

  /** Directed dependency edge between workspace packages. */
  export type PackageEdge = {
    /** Dependency package path that must be ordered first. */
    readonly from: Package['path'];
    /** Dependent package path that requires `from`. */
    readonly to: Package['path'];
    /** Local module imports that witness this package edge. */
    readonly imports: readonly ModuleEdge[];
  };

  /**
   * Derived package dependency graph.
   *
   * This graph intentionally models package/package dependency truth only.
   * Target collection roots remain a module-graph concern.
   */
  export type PackageGraph = {
    /** Working directory used as the normalization anchor. */
    readonly cwd: t.StringDir;
    /** Discovered workspace packages. */
    readonly packages: readonly Package[];
    /** Directed package dependency edges. */
    readonly edges: readonly PackageEdge[];
  };

  /** One ordered package item. */
  export type PackageOrderItem = {
    /** Ordered package. */
    readonly package: Package;
    /** Zero-based order index. */
    readonly index: number;
    /** Direct package dependencies that must precede this package. */
    readonly after: readonly Package['path'][];
  };

  /** Successful package-order result. */
  export type Ordered = {
    readonly ok: true;
    readonly graph: PackageGraph;
    readonly items: readonly PackageOrderItem[];
  };

  /** Invalid package-order input. */
  export type Invalid = {
    readonly ok: false;
    readonly graph: PackageGraph;
    readonly invalid: {
      readonly code: 'package:duplicate-key' | 'package-edge:unknown-node';
      readonly keys: readonly Package['path'][];
    };
  };

  /** Cyclic package-order input. */
  export type Cyclic = {
    readonly ok: false;
    readonly graph: PackageGraph;
    readonly cycle: { readonly keys: readonly Package['path'][] };
  };

  /** Package-order result. */
  export type PackageOrderResult = Ordered | Invalid | Cyclic;

  /** Persisted package-edge payload used by downstream tooling. */
  export type PersistedEdge = {
    readonly from: Package['path'];
    readonly to: Package['path'];
  };

  /** Persisted workspace graph payload. */
  export type PersistedGraph = {
    readonly orderedPaths: readonly Package['path'][];
    readonly edges: readonly PersistedEdge[];
  };

  /** Persisted workspace graph snapshot helpers and document shapes. */
  export namespace Snapshot {
    /** Runtime snapshot helper surface. */
    export type Lib = {
      create(args: CreateArgs): Doc;
      read(path: t.StringPath): Promise<Doc | undefined>;
      write(snapshot: Doc, path: t.StringPath): Promise<Doc>;
    };

    /** Snapshot document metadata. */
    export type Meta = t.JsonFileMeta & {
      readonly schemaVersion: 2;
      /**
       * `:<qualifier>` suffixes attach provenance metadata to the base object-path key.
       * `:` is reserved for ref qualifiers, not ordinary snapshot field names.
       */
      readonly hash: {
        readonly '/graph': t.StringHash;
        readonly '/graph:policy': t.StringUrl;
      };
      readonly generator: {
        readonly pkg: t.Pkg;
        readonly types: {
          readonly '/graph': t.StringUrl;
        };
      };
    };

    /** Persisted graph snapshot document. */
    export type Doc = {
      readonly '.meta': Meta;
      readonly graph: PersistedGraph;
    };

    /** Snapshot creation arguments. */
    export type CreateArgs = {
      readonly graph: PersistedGraph;
    };
  }
}
