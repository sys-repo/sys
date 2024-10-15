/**
 * @system
 */
export type {
  Observable,
  Disposable,
  Event,
  EventBus,
  IgnoredResponse,
  Immutable,
  ImmutableMutator,
  ImmutableRef,
  Json,
  JsonMap,
  Lifecycle,
  Msecs,
  UntilObservable,
} from '@sys/types';

// export type {
//   BundleImport,
//   SpecImports,
//   TestHandlerArgs,
//   TestModel,
//   TestSuiteModel,
//   TestSuiteRunResponse,
// } from 'sys.test.spec/src/types';

export type { CssValue } from '../../../../u/m.Style/t.ts';

/**
 * @local
 */
export type UrlString = string;
export type UrlInput = string | URL | Location;
export type * from './mod.ts';
