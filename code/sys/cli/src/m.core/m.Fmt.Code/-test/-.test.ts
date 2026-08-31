import { describe, expect, it } from '../../../-test.ts';
import { Cli, Fmt as BaseFmt } from '../../mod.ts';
import { Code, Fmt } from '../mod.ts';

describe('Cli.Fmt.Code', () => {
  it('API', async () => {
    const base = await import('@sys/cli/fmt');
    const m = await import('@sys/cli/fmt/code');

    expect('Code' in base.Fmt).to.eql(false);
    expect(m.Code).to.equal(Code);
    expect(m.Fmt).to.equal(Fmt);
    expect(m.Fmt.hr).to.equal(BaseFmt.hr);
    expect(m.Fmt.Keyboard).to.equal(BaseFmt.Keyboard);
    expect(m.Fmt.Keyboard).to.equal(Cli.Fmt.Keyboard);
    expect(m.Fmt.Code).to.equal(Code);
    expect(m.Fmt.Code.highlight).to.equal(Code.highlight);
  });
});
