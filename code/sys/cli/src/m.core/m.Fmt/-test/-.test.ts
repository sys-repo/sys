import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';

describe('Cli.Fmt', () => {
  it('API', async () => {
    const m = await import('@sys/cli/fmt');
    expect(m.Fmt).to.equal(Fmt);
    expect(m.Fmt).to.equal(Cli.Fmt);
    expect(m.Fmt.Header).to.equal(Fmt.Header);
    expect(m.Fmt.hyperlink).to.equal(Fmt.hyperlink);
    expect(m.Text).to.equal(Fmt.Text);
  });
});
