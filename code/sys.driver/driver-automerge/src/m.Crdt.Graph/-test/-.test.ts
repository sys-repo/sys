import {
  type t,
  beforeAll,
  afterAll,
  describe,
  expect,
  expectTypeOf,
  it,
  spawnTestWorker,
} from '../../-test.ts';

describe(`Crdt.Graph`, () => {
  let env: t.TestWorkerEnv;
  beforeAll(async () => void (env = await spawnTestWorker()));
  afterAll(() => env?.dispose());

});
