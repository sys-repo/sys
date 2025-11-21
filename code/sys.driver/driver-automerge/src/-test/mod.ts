import 'fake-indexeddb/auto';

export {
  DomMock,
  Testing,
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  c,
  describe,
  expect,
  expectError,
  expectTypeOf,
  it,
} from '@sys/testing/server';

export { spawnTestWorker } from '../-test.fs.worker/mod.ts';
export * from '../common.ts';
