import { describe, expect, it } from '../../-test.ts';
import { BROWSER_SYNTAX_TARGETS, browserSyntaxTargets } from '../u/u.browserSyntaxTargets.ts';

const EXPECTED = ['chrome111', 'edge111', 'firefox114', 'safari16.4', 'ios16.4'];

describe('ViteConfig: browser syntax targets', () => {
  it('owns the exact frozen browser floor and returns fresh mutable copies', () => {
    expect(BROWSER_SYNTAX_TARGETS).to.eql(EXPECTED);
    expect(Object.isFrozen(BROWSER_SYNTAX_TARGETS)).to.eql(true);

    const first = browserSyntaxTargets();
    const second = browserSyntaxTargets();

    expect(first).to.eql(EXPECTED);
    expect(second).to.eql(EXPECTED);
    expect(first).not.to.equal(second);
    expect(Object.isFrozen(first)).to.eql(false);
    expect(Object.isFrozen(second)).to.eql(false);

    first.pop();
    second.shift();
    expect(first).to.eql(EXPECTED.slice(0, -1));
    expect(second).to.eql(EXPECTED.slice(1));
    expect(BROWSER_SYNTAX_TARGETS).to.eql(EXPECTED);
    expect(browserSyntaxTargets()).to.eql(EXPECTED);
  });
});
