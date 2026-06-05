import type { t } from './common.ts';

/**
 * DevHarness Loader types for spec-loading and spec-materialization.
 */
export declare namespace Loader {
  /** Runtime API surface for the Loader module. */
  export type Lib = {
    load: Load;
  };

  /** Creates a concrete test suite from typed import-time params. */
  export type Factory<TParams = void> = (
    params: TParams,
  ) => t.TestSuiteModel | Promise<t.TestSuiteModel>;

  /**
   * Structural module shape for a parameterized spec import target.
   *
   * A module may expose a ready-made default suite, a typed
   * spec factory, or both.
   */
  export type Module<TParams = void> = {
    default?: t.TestSuiteModel;
    createSpec?: Factory<TParams>;
  };

  /** Structural lazy module-loader for a parameterized spec module. */
  export type ModuleLoader<TParams = void> = () => Promise<Module<TParams>>;

  /**
   * Structural adapter from a parameterized spec loader into the standard
   * lazy DevHarness spec-import contract.
   *
   * @example
   * Loader.load(() => import('./-SPEC.tsx'))
   *
   * @example
   * type Foo = { count: number };
   *
   * const from: Loader.ModuleLoader<Foo> = () => import('./-SPEC.tsx');
   * const spec = Loader.load(from, { count: 1 });
   */
  export type Load = <TParams = void>(
    from: ModuleLoader<TParams>,
    ...args: [TParams] extends [void] ? [] | [params: TParams] : [params: TParams]
  ) => t.SpecImporter;
}
