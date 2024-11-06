/**
 * @external
 */
export type { IconType } from 'react-icons';

/**
 * @system
 */
export type {
  ColorConstants,
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
  StringHex,
  StringId,
  StringUrl,
  TimeThreshold,
  UntilObservable,
} from '@sys/std/t';

export type {
  SpecImport,
  SpecImporter,
  SpecImports,
  SpecModule,
  TestHandlerArgs,
  TestModel,
  TestSuiteDescribe,
  TestSuiteModel,
  TestSuiteRunResponse,
} from '@sys/testing/t';

export type {
  CssEdgesArray,
  CssMarginArray,
  CssMarginInput,
  CssPaddingArray,
  CssValue,
  KeyboardEventsUntil,
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
