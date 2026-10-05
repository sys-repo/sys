import { parse, parseFragment } from 'parse5';
import { describe, expect, it } from '../../-test.ts';
import { Html } from '../m.Html.ts';
import { Is } from '../m.Is.ts';

describe('Html', () => {
  it('API', async () => {
    const m = await import('@sys/html');

    expect(m.pkg.name).to.eql('@sys/html');
    expect(m.Html).to.equal(Html);
    expect(m.Html).to.have.keys(['parse', 'parseFragment', 'Is']);
    expect(m.Html.Is).to.equal(Is);
    expect(m.Html.Is).to.have.keys(['element', 'template']);
    expect(Object.isFrozen(m.Html)).to.eql(true);
    expect(Object.isFrozen(m.Html.Is)).to.eql(true);
    expect(m.Html.parse).to.equal(parse);
    expect(m.Html.parseFragment).to.equal(parseFragment);
  });
});
