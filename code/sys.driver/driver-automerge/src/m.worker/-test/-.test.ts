import { describe, expect, expectTypeOf, it } from '../../-test.ts';
import { CrdtWorker } from '../mod.ts';
import { createRepo } from '../u.createRepo.ts';

describe(`CRDT: web-worker transport`, () => {
  it('API', async () => {
    expect(CrdtWorker.repo).to.equal(createRepo);
  });
});
