import { type t, describe, it, expect, Pkg, pkg } from '../-test.ts';
import { Pi } from '../mod.ts';

describe(`module: ${Pkg.toString(pkg)}`, () => {
  it('exists', async () => {
    const m = await import('@sys/driver-pi');
    console.info(`💦 Module`, pkg);
    expect(typeof pkg.name === 'string').to.be.true;
    expect(m.Pi).to.equal(Pi);
  });
});
