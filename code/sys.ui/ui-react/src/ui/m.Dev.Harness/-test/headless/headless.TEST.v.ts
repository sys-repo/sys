import { Dev } from '../..';
import { describe, expect, it } from '../../test';

describe('headless (test runner)', () => {
  it('success (OK)', async () => {
    const Specs = {
      'sample.MySample': () => import('../sample.specs/-SPEC.MySample'),
      'sample.empty': () => import('../sample.specs/-SPEC.Empty'),
    };
    const res = await Dev.headless(Specs);
    expect(res.ok).to.eql(true);
    expect(res.total).to.eql(2);
    expect(res.elapsed).to.greaterThan(0);
  });

  it('fail', async () => {
    const Specs = {
      'sample.Fail': () => import('../sample.specs/-SPEC.Fail'),
    };
    const res = await Dev.headless(Specs);
    expect(res.ok).to.eql(false);
    expect(res.total).to.eql(1);
    expect(res.elapsed).to.greaterThan(0);
  });
});
