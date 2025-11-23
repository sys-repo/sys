import { describe, it, beforeAll, afterAll, expect } from '../../-test.ts';
import { type t } from '../common.ts';
import { makeWorkerFixture } from './u.ts';

describe('Crdt.Worker (integration)', () => {
  let fixture: t.TestWorkerFixture;

  beforeAll(async () => {
    fixture = await makeWorkerFixture();
  });

  afterAll(() => fixture?.dispose());

});
