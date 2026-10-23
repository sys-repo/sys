import { afterAll, beforeAll, describe, DomMock, expect, it } from '../-test.ts';
import { Harness } from '../mod.ts';
import { Specs } from './-specs.ts';

/**
 * Sample of testing the visual UI specs headlessly on the server.
 *
 * NOTE:
 *    This allows basic compilation and other load issues, or any
 *    assertions within the visual specs, to be included and monitored
 *    within the CI pipeline.
 */
describe('visual specs', () => {
  DomMock.init({ beforeAll, afterAll });

  it('run', async () => {
    const res = await Harness.headless(Specs);
    expect(res.ok).to.eql(true);
  });
});
