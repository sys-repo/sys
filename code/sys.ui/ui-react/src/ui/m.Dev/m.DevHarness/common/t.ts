/**
 * @external
 */
export type { IconType } from 'react-icons';
// export type { Observable } from 'rxjs';

/**
 * @system
 */
// export type {
// CommonTheme,
// Disposable,
// DomRect,
// Event,
// EventBus,
// IgnoredResponse,
// ImageBadge,
// Json,
// JsonMap,
// Lifecycle,
// ModuleImport,
// ModuleImporter,
// ModuleImports,
// Msecs,
// UntilObservable,
// } from 'sys.types/src/types';

export type {
  SpecImport,
  SpecImporter,
  SpecImports,
  SpecModule,
  TestHandlerArgs,
  TestModel,
  TestSuiteModel,
  TestSuiteRunResponse,
} from '@sys/testing/t';

/**
 * @local
 */
export type UrlInput = string | URL | Location;
// export type MarginInput = number | [number] | [number, number] | [number, number, number, number];
// export type Margin = [number, number, number, number];

export type * from '../t.ts';
export type * from '../../../../common/t.ts';
