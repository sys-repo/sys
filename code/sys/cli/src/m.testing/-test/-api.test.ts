import { describe, expect, it } from '../../-test.ts';
import { FakeSpinner } from '../mod.ts';

describe('CLI: testing / API', () => {
  it('exports the FakeSpinner surface', async () => {
    const m = await import('@sys/cli/testing');

    expect(m.FakeSpinner).to.equal(FakeSpinner);
  });
});
