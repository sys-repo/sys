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

export { makeWorkerFixture } from '../m.worker/-test.u/u.fixture.client.ts';
export * from '../common.ts';
