import { describe, expect, it } from '../../-test.ts';
import { c } from '../common.ts';
import { Color } from '../mod.ts';
import { foreground } from '../u.foreground.ts';

describe('Ansi.foreground', () => {
  it('exposes the intended foreground formatter subset', () => {
    expect(Color.foreground).to.equal(foreground);
    expect(foreground.green).to.equal(c.green);
    expect(foreground.brightCyan).to.equal(c.brightCyan);
    expect(foreground.gray).to.equal(c.gray);
  });
});
