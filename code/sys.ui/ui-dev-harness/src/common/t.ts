/**
 * @external
 */
export type { IconType } from 'react-icons';

/**
 * @system
 */
export type {
  SpecImport,
  SpecImporter,
  SpecImports,
  SpecModule,
  TestSuiteDescribe,
  TestHandlerArgs,
  TestModel,
  TestSuiteModel,
  TestSuiteRunResponse,
} from '@sys/testing/t';

export type {
  CommonTheme,
  Disposable,
  Event,
  EventBus,
  Falsy,
  IgnoredResponse,
  Immutable,
  ImmutableMutator,
  ImmutableRef,
  Json,
  JsonMap,
  JsonMapU,
  JsonU,
  Lifecycle,
  ModuleImport,
  ModuleImporter,
  ModuleImports,
  Msecs,
  Observable,
  Percent,
  Point,
  StringUrl,
  StringId,
  TimeThreshold,
  UntilObservable,
} from '@sys/std/t';

export type {
  CssEdgesArray,
  CssMarginArray,
  CssMarginInput,
  CssPaddingArray,
  CssValue,
  KeyboardModifierFlags,
} from '@sys/ui-dom/t';

/**
 * @local
 */
export type UrlInput = string | URL | Location;

/**
 * Query string index.
 */
export type DefaultsQueryString = {
  d: string; // NB: alias for "?dev"
  dev: string;
  selected: string;
  filter: string;
};

export type * from '../types.ts';
