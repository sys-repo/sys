import { describe, expect, it } from '../../-test.ts';
import { Color } from '../mod.ts';
import { escape } from '../u.escape.ts';

describe('Ansi.escape', () => {
  it('defines raw ANSI escape sequences behind Color.escape', () => {
    expect(Color.escape).to.equal(escape);

    expect(escape.reset).to.eql('\x1b[0m');
    expect(escape.italic).to.eql('\x1b[3m');
    expect(escape.bold).to.eql('\x1b[1m');
    expect(escape.underline).to.eql('\x1b[4m');
  });
});
