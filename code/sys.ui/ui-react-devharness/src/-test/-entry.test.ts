import { Dev } from '../mod.ts';
import { describe, expect, it } from '../-test.ts';
import { Specs } from './entry.Specs.ts';
import { DomMock } from '../../../../sys/testing/src/ns.server/mod.ts';

/**
 * Sample of testing the visual UI specs headlessly on the server.
 *
 * NOTE:
 *    This allows basic compilation and other load issues, or any
 *    assertions within the visual specs, to be included and monitored
 *    within the CI pipeline.
 */
describe('visual specs', () => {
  DomMock.polyfill();

  it('run', async () => {
    const res = await Dev.headless(Specs);
    expect(res.ok).to.eql(true);
  });
});
