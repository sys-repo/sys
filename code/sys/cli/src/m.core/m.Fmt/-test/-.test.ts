import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';

describe('Cli.Fmt', () => {
  it('API', async () => {
    const m = await import('@sys/cli/fmt');
    expect(m.Fmt).to.equal(Fmt);
    expect(m.Fmt).to.equal(Cli.Fmt);
  });
});
