/**
 * @system
 */

export type {
  BundleImport,
  SpecImports,
  TestHandlerArgs,
  TestModel,
  TestSuiteModel,
  TestSuiteRunResponse,
} from '@sys/testing/t';

export type { CssValue } from '../../../../u/m.Style/t.ts';
export type * from '../../../../common/t.ts';
export type * from './mod.ts';

/**
 * @local
 */
export type UrlString = string;
export type UrlInput = string | URL | Location;
