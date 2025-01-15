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

export type * from '../common/t.ts';
export type * from './mod.ts';

/**
 * @local
 */
export type UrlString = string;
export type UrlInput = string | URL | Location;
