import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Json } from '../../../m.Json/mod.ts';
import { Pkg } from '../../mod.ts';

const digest = `sha256-${'a'.repeat(64)}`;
const pin = { scheme: 'sys.dist/v2', digest };

describe('Pkg.Is.distPin', () => {
  it('narrows the exact content expectation without freezing caller data', () => {
    const input: unknown = { ...pin };
    expect(Pkg.Is.distPin(input)).to.eql(true);
    if (!Pkg.Is.distPin(input)) throw new Error('Expected pin.');
    expectTypeOf(input).toEqualTypeOf<t.DistPin>();
    expect(Object.isFrozen(input)).to.eql(false);
    expect(Pkg.Is.distPin(Object.freeze({ ...pin }))).to.eql(true);
  });

  it('requires exactly two own data keys on a plain record', () => {
    let getters = 0;
    const accessor = Object.defineProperty({ scheme: pin.scheme }, 'digest', {
      get() {
        getters++;
        return digest;
      },
    });
    const invalid: readonly unknown[] = [
      null,
      undefined,
      [],
      digest,
      1,
      true,
      {},
      { digest },
      { scheme: pin.scheme },
      { ...pin, files: [] },
      { ...pin, [Symbol('extra')]: true },
      Object.defineProperty({ ...pin }, 'extra', { value: true }),
      Object.create(pin),
      Object.assign(Object.create(null), pin),
      accessor,
    ];
    for (const input of invalid) expect(Pkg.Is.distPin(input)).to.eql(false);
    expect(getters).to.eql(0);
    const data = Object.defineProperties({}, {
      scheme: { value: pin.scheme },
      digest: { value: digest },
    });
    expect(Pkg.Is.distPin(data)).to.eql(true);
  });

  it('rejects byte pins, mixed contracts, and missing or unsupported schemes', () => {
    const invalid = [
      { 'dist.json': digest },
      { ...pin, 'dist.json': digest },
      { ...pin, scheme: undefined },
      { ...pin, scheme: 'sys.dist/v1' },
      { ...pin, scheme: 'sys.dist/v3' },
      { ...pin, scheme: 'sys.dist/v2\n' },
    ];
    for (const input of invalid) expect(Pkg.Is.distPin(input)).to.eql(false);
  });

  it('accepts only a complete canonical SHA-256 digest without a size suffix', () => {
    const invalid: readonly unknown[] = [
      null,
      undefined,
      123,
      {},
      [],
      Object(digest),
      '',
      digest.toUpperCase(),
      `sha256-${'g'.repeat(64)}`,
      digest.slice(0, -1),
      `${digest}a`,
      `${digest}:size=0`,
      `${digest}:size=1`,
      ` ${digest}`,
      `${digest} `,
      `${digest}\n`,
      `${digest}\r\n`,
      `${digest}:digest`,
    ];
    for (const value of invalid) expect(Pkg.Is.distPin({ ...pin, digest: value })).to.eql(false);
  });

  it('uses decoded JSON last-member-wins semantics, including escaped names', () => {
    const valid = Json.parse(
      `{"scheme":"bad","scheme":"sys.dist/v2","digest":"bad","di\\u0067est":"${digest}"}`,
    );
    const invalid = Json.parse(
      `{"scheme":"sys.dist/v2","scheme":"bad","digest":"${digest}"}`,
    );
    expect(Pkg.Is.distPin(valid)).to.eql(true);
    expect(Pkg.Is.distPin(invalid)).to.eql(false);
  });
});
