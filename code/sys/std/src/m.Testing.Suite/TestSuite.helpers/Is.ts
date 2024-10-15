import { Is as base } from '../../m.Is/mod.ts';
import type { t } from './common.ts';

export const Is = {
  promise: base.promise,

  suiteId(input: any) {
    return typeof input === 'string' && input.startsWith('TestSuite.');
  },

  testId(input: any) {
    return typeof input === 'string' && input.startsWith('Test.');
  },

  suite(input: any): input is t.TestSuiteModel {
    if (typeof input === 'string' && input.startsWith('TestSuite.')) return true;
    if (typeof input !== 'object' || input === null) return false;
    if (typeof input.id !== 'string') return false;
    return (
      input.kind === 'TestSuite' &&
      Is.suiteId(input.id) &&
      typeof input.describe === 'function' &&
      typeof input.it === 'function' &&
      typeof input.run === 'function'
    );
  },

  test(input: any): input is t.TestModel {
    if (typeof input !== 'object' || input === null) return false;
    if (typeof input.id !== 'string') return false;
    return input.kind === 'Test' && Is.testId(input.id) && typeof input.run === 'function';
  },

  testArgs(input: any): input is t.TestHandlerArgs {
    if (typeof input !== 'object' || input === null) return false;
    return (
      Is.testId(input.id) &&
      typeof input.description === 'string' &&
      typeof input.timeout === 'function'
    );
  },

  results(input: any): input is t.TestSuiteRunResponse {
    if (typeof input !== 'object' || input === null) return false;
    return Is.suiteId(input.id) && (input.tx || '').startsWith('run.suite.tx.');
  },
};
