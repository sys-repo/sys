import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Json } from '../../m.Json/mod.ts';
import { Pkg } from '../mod.ts';

const checksum = `sha256-${'a'.repeat(64)}`;

describe('Pkg.Is.distPin', () => {
  it('narrows one exact manifest expectation without freezing caller data', () => {
    const input: unknown = { 'dist.json': checksum };
    expect(Pkg.Is.distPin(input)).to.eql(true);
    if (!Pkg.Is.distPin(input)) throw new Error('Expected pin.');
    expectTypeOf(input).toEqualTypeOf<t.DistPin>();
    expectTypeOf(input['dist.json']).toEqualTypeOf<t.StringHash>();
    expect(Object.isFrozen(input)).to.eql(false);
    expect(Pkg.Is.distPin(Object.freeze({ 'dist.json': checksum }))).to.eql(true);
  });

  it('requires exactly one own data key on a plain record', () => {
    let getters = 0;
    const accessor = Object.defineProperty({}, 'dist.json', {
      get() {
        getters++;
        return checksum;
      },
    });
    const invalid: readonly unknown[] = [
      null,
      undefined,
      [],
      checksum,
      1,
      true,
      {},
      { 'other.json': checksum },
      { 'dist.json': checksum, files: [] },
      { 'dist.json': checksum, [Symbol('extra')]: true },
      Object.defineProperty({ 'dist.json': checksum }, 'extra', { value: true }),
      Object.create({ 'dist.json': checksum }),
      Object.assign(Object.create(null), { 'dist.json': checksum }),
      accessor,
    ];
    for (const input of invalid) expect(Pkg.Is.distPin(input)).to.eql(false);
    expect(getters).to.eql(0);
    const data = Object.defineProperty({}, 'dist.json', { value: checksum });
    expect(Pkg.Is.distPin(data)).to.eql(true);
  });

  it('accepts only a complete canonical checksum without a size suffix', () => {
    const invalid: readonly unknown[] = [
      null,
      undefined,
      123,
      {},
      [],
      Object(checksum),
      '',
      checksum.toUpperCase(),
      `sha256-${'g'.repeat(64)}`,
      checksum.slice(0, -1),
      `${checksum}a`,
      `${checksum}:size=0`,
      `${checksum}:size=1`,
      ` ${checksum}`,
      `${checksum} `,
      `${checksum}\n`,
      `${checksum}\r\n`,
      `${checksum}:digest`,
    ];
    for (const value of invalid) expect(Pkg.Is.distPin({ 'dist.json': value })).to.eql(false);
  });

  it('uses decoded JSON last-member-wins semantics, not source duplicate detection', () => {
    const validLast = Json.parse(`{"dist.json":"bad","dist.json":"${checksum}"}`);
    const invalidLast = Json.parse(`{"dist.json":"${checksum}","dist.json":"bad"}`);
    expect(Pkg.Is.distPin(validLast)).to.eql(true);
    expect(Pkg.Is.distPin(invalidLast)).to.eql(false);
  });
});
