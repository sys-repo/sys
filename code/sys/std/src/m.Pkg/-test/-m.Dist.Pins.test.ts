import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Pkg } from '../mod.ts';

const pin = { 'dist.json': `sha256-${'a'.repeat(64)}` };

describe('Pkg.Dist.Pins.capture', () => {
  it('widened name arrays cannot promise an absent member of their element union', () => {
    type Audience = 'private' | 'public';
    const names: readonly Audience[] = ['private'];
    const input = { pins: { private: pin } };
    // @ts-expect-error An element union does not witness every required key.
    expect(() => Pkg.Dist.Pins.capture(input, { names })).to.throw(TypeError);
    // @ts-expect-error Explicit type arguments cannot establish missing runtime keys either.
    expect(() => Pkg.Dist.Pins.capture<Audience>(input, { names })).to.throw(TypeError);
  });

  it('complete witnesses infer only established names; unqualified capture stays dynamic', () => {
    type Audience = 'private' | 'public';
    const input = { pins: { private: pin, public: pin } };
    const result = Pkg.Dist.Pins.capture(input, { names: { private: true, public: true } });
    expectTypeOf(result).toEqualTypeOf<t.DistPins<Audience>>();
    expectTypeOf(Pkg.Dist.Pins.capture(input)).toEqualTypeOf<t.DistPins>();
    expectTypeOf(Pkg.Dist.Pins.capture<Audience>(input, {
      names: { private: true, public: true },
    })).toEqualTypeOf<t.DistPins<Audience>>();
    expect(result.pins.public).to.eql(pin);
    expect(() => {
      // @ts-expect-error An explicit union still requires a witness for public.
      Pkg.Dist.Pins.capture<Audience>(input, { names: { private: true } });
    }).to.throw(TypeError);
    const single = Pkg.Dist.Pins.capture({ pins: { private: pin } }, { names: { private: true } });
    expectTypeOf(single).toEqualTypeOf<t.DistPins<'private'>>();
    // @ts-expect-error The witness establishes no public member.
    expect(single.pins.public).to.eql(undefined);
  });

  it('pins-only input → accepted without build settings', () => {
    const input = { pins: { shell: pin } };
    expect(Pkg.Dist.Pins.capture(input)).to.eql(input);
    expect(() => Pkg.Dist.Pins.capture({ ...input, bindings: {} })).to.throw(TypeError);
  });

  it('caller edits → captured pins and required names remain unchanged', () => {
    const input = { pins: { shell: { ...pin } } };
    const names: Record<string, true> = { shell: true };
    const requirements = { names };
    const result = Pkg.Dist.Pins.capture(input, requirements);
    input.pins.shell['dist.json'] = 'changed';
    delete names.shell;
    names.other = true;
    expect(result).to.eql({ pins: { shell: pin } });
    expect(Object.isFrozen(result)).to.eql(true);
    expect(Object.isFrozen(result.pins)).to.eql(true);
    expect(Object.isFrozen(result.pins.shell)).to.eql(true);
  });

  it('invalid records or pins → fixed TypeError message', () => {
    const valid = { pins: { shell: pin } };
    let calls = 0;
    const accessor = {
      get shell() {
        calls++;
        return pin;
      },
    };
    const inputs = [
      null,
      {},
      { ...valid, extra: 'secret' },
      { ...valid, [Symbol()]: 'secret' },
      { ...valid, pins: {} },
      { ...valid, pins: { '': pin } },
      { ...valid, pins: { [Symbol()]: pin } },
      { ...valid, pins: { shell: { ...pin, extra: 1 } } },
      { ...valid, pins: { shell: { 'dist.json': `${pin['dist.json']}:size=1` } } },
      { ...valid, pins: accessor },
      { ...valid, pins: Object.create({ shell: pin }) },
    ];
    for (const input of inputs) {
      expect(() => Pkg.Dist.Pins.capture(input)).to.throw(TypeError, 'Invalid Dist pins.');
    }
    expect(calls).to.eql(0);
    expect(Pkg.Dist.Pins.capture(valid)).to.eql(valid);
  });

  it('missing or extra names and extra requirement fields → refusal', () => {
    const input = { pins: { shell: pin } };
    const sets: readonly Record<string, true>[] = [{}, { other: true }, {
      shell: true,
      other: true,
    }];
    for (const names of sets) {
      expect(() => Pkg.Dist.Pins.capture(input, { names })).to.throw(TypeError);
    }
    for (
      const requirements of [
        { names: { shell: true }, bindings: {} },
        { names: { shell: true }, extra: 'secret' },
      ] as const
    ) {
      expect(() => Pkg.Dist.Pins.capture(input, requirements)).to.throw(TypeError);
    }
    expect(Pkg.Dist.Pins.capture(input, { names: { shell: true } })).to.eql(input);
  });

  it('malformed witnesses → refusal without invoking getters', () => {
    const input = { pins: { shell: pin } };
    let calls = 0;
    const accessor = Object.defineProperty({}, 'shell', {
      get() {
        calls++;
        return true;
      },
    });
    const sparse: string[] = new Array(1);
    const requirements: readonly unknown[] = [
      { names: sparse },
      { names: ['shell'] },
      { names: ['shell', 'shell'] },
      { names: accessor },
      { names: Object.create({ shell: true }) },
      { names: { shell: false } },
      { names: { shell: 1 } },
      { names: { '': true } },
      { names: { shell: true, [Symbol()]: true } },
      { names: { shell: true }, [Symbol()]: true },
      Object.create({ names: { shell: true } }),
      {
        get names() {
          calls++;
          return { shell: true };
        },
      },
    ];
    for (const required of requirements) {
      // @ts-expect-error Exercise untrusted runtime requirements.
      expect(() => Pkg.Dist.Pins.capture(input, required)).to.throw(
        TypeError,
        'Invalid Dist pins.',
      );
    }
    expect(calls).to.eql(0);
  });

  it('__proto__ and constructor remain ordinary pin names', () => {
    const pins = Object.fromEntries([['__proto__', pin], ['constructor', pin]]);
    const names = Object.fromEntries([['__proto__', true], ['constructor', true]] as const);
    const result = Pkg.Dist.Pins.capture({ pins }, { names });
    expect(Object.keys(result.pins)).to.eql(['__proto__', 'constructor']);
    expect(result.pins['__proto__']).to.eql(pin);
    expect(Object.getPrototypeOf(result.pins)).to.equal(Object.prototype);
  });
});
