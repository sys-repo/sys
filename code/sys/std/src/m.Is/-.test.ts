import { describe, expect, it } from '../-test.ts';
import { isEmptyRecord, isObject, isRecord } from '../common.ts';
import { Err, Is, rx, Rx } from '../mod.ts';

describe('Is (common flags)', () => {
  it('API', () => {
    expect(Is.object).to.equal(isObject);
    expect(Is.record).to.eql(isRecord);
    expect(Is.emptyRecord).to.eql(isEmptyRecord);
  });

  it('rx: observable | subject', () => {
    // NB: tested in the corresponding module file.
    expect(Is.observable).to.equal(Rx.Is.observable);
    expect(Is.subject).to.equal(Rx.Is.subject);
  });

  it('error', () => {
    expect(Is.errorLike).to.equal(Err.Is.errorLike);
    expect(Is.stdError).to.equal(Err.Is.stdError);
  });

  it('Is.promise', () => {
    const test = (input: any, expected: boolean) => {
      expect(Is.promise(input)).to.eql(expected);
    };

    const myPromise = () => new Promise<void>((resolve) => resolve());
    const wait = async () => await myPromise();

    test(undefined, false);
    test(123, false);
    test('hello', false);
    test(['hello', 123], false);
    test(true, false);
    test(null, false);
    test({}, false);

    test({ then: () => null }, true);
    test(wait(), true);
    test(myPromise(), true);

    const p = myPromise as unknown;
    if (Is.promise<string>(p)) {
      p.then(); // Type inferred after boolean check.
    }
  });

  it('Is.numeric', () => {
    const assert = (value: unknown, expected: boolean) => {
      expect(Is.numeric(value)).to.eql(expected);
    };
    assert(123, true);
    assert('456', true);
    assert('123.456', true);
    assert('  789  ', true);
    assert('12e3', true);
    assert('0xFF', true);
    assert('NaN', false);
    assert(NaN, false);
    assert(null, false);
    assert('Infinity', false);
    assert('-Infinity', false);
    assert('', false);
    assert('   ', false);
    assert('abc123', false);
    assert(null, false);
    assert(undefined, false);
    assert(true, false);
    assert({}, false);
    assert([], false);
    assert(BigInt(123), true);
  });

  it('Is.nil', () => {
    const test = (input: unknown, expected: boolean) => {
      expect(Is.nil(input)).to.eql(expected, input);
    };
    test(null, true);
    test(undefined, true);

    const NON = ['', 123, true, BigInt(0), Symbol('foo'), {}, []];
    NON.forEach((v: any) => test(v, false));
  });

  it('Is.falsy', () => {
    const test = (input: unknown, expected: boolean) => {
      expect(Is.falsy(input)).to.eql(expected, input);
    };
    test(false, true);
    test(0, true);
    test('', true);
    test(null, true);
    test(undefined, true);
    test(NaN, true);
    test(BigInt(0), true);

    test(42, false);
    test('Hello', false);
    test({}, false);
    test([], false);
    test(true, false);
    test(Symbol('foo'), false);
    test(BigInt(1), false);
    test(new Date(), false);
  });

  describe('Is.json', () => {
    it('is not JSON', () => {
      expect(Is.json()).to.eql(false);
      expect(Is.json(null)).to.eql(false);
      expect(Is.json(123)).to.eql(false);
      expect(Is.json(new Date())).to.eql(false);
      expect(Is.json({})).to.eql(false);
    });

    it('is a string but not JSON', () => {
      expect(Is.json('')).to.eql(false);
      expect(Is.json('  ')).to.eql(false);
      expect(Is.json('hello')).to.eql(false);
    });

    it('is JSON', () => {
      expect(Is.json('{}')).to.eql(true);
      expect(Is.json('[]')).to.eql(true);
      expect(Is.json('{ "foo": 123 }')).to.eql(true);
      expect(Is.json('[1,2,3]')).to.eql(true);
    });

    it('is JSON (trimmed string)', () => {
      expect(Is.json('  {} ')).to.eql(true);
      expect(Is.json(' []  ')).to.eql(true);
    });
  });

  describe('Is.arrayBufferLike', () => {
    const binary = new Uint8Array([1, 2, 3]);
    it('is not ArrayBufferLike', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v) => expect(Is.arrayBufferLike(v)).to.eql(false));
      expect(Is.arrayBufferLike(binary)).to.eql(false);
    });

    it('is ArrayBufferLike', () => {
      expect(Is.arrayBufferLike(binary.buffer)).to.eql(true);
    });
  });

  describe('Is.uint8Array', () => {
    const binary = new Uint8Array([1, 2, 3]);

    it('is not Uint8Array', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v) => expect(Is.uint8Array(v)).to.eql(false));
      expect(Is.uint8Array(binary.buffer)).to.eql(false);
    });

    it('is Uint8Array', () => {
      expect(Is.uint8Array(binary)).to.equal(true);
    });
  });

  describe('Is.blank', () => {
    describe('blank', () => {
      it('is blank (nothing)', () => {
        expect(Is.blank(undefined)).to.eql(true);
        expect(Is.blank(null)).to.eql(true);
      });

      it('is blank (string)', () => {
        expect(Is.blank('')).to.eql(true);
        expect(Is.blank(' ')).to.eql(true);
        expect(Is.blank('   ')).to.eql(true);
      });

      it('is blank (array)', () => {
        expect(Is.blank([])).to.eql(true);
        expect(Is.blank([null])).to.eql(true);
        expect(Is.blank([undefined])).to.eql(true);
        expect(Is.blank([undefined, null])).to.eql(true);
        expect(Is.blank([undefined, null, ''])).to.eql(true);
      });
    });

    describe('NOT blank', () => {
      it('is not blank (string)', () => {
        expect(Is.blank('a')).to.eql(false);
        expect(Is.blank('   .')).to.eql(false);
      });

      it('is not blank (array)', () => {
        expect(Is.blank([1])).to.eql(false);
        expect(Is.blank([null, 'value'])).to.eql(false);
        expect(Is.blank([null, '   .'])).to.eql(false);
      });

      it('is not blank (other values)', () => {
        expect(Is.blank(1)).to.eql(false);
        expect(Is.blank({})).to.eql(false);
        expect(Is.blank(() => 0)).to.eql(false);
      });
    });
  });

  describe('Is.netaddr', () => {
    it('Is.netaddr: false', () => {
      const NON = ['foo', 123, false, null, undefined, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((v) => expect(Is.netaddr(v)).to.eql(false));
    });

    it('Is.netaddr: true', async () => {
      const server = Deno.serve((req) => new Response('Hello'));
      expect(Is.netaddr(server.addr)).to.eql(true);
      await server.shutdown();
    });
  });

  describe('Is.statusOK', () => {
    it('Is.statusOK: true', () => {
      expect(Is.statusOK(200)).to.eql(true);
      expect(Is.statusOK(201)).to.eql(true);
    });

    it('Is.statusOK: false', () => {
      const NON = ['foo', 123, false, null, undefined, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((v: any) => expect(Is.statusOK(v)).to.eql(false));
      expect(Is.statusOK(404)).to.eql(false);
    });
  });

  describe('Is.disposable', () => {
    it('Is.disposable: true', () => {
      const disposable = rx.disposable();
      const life = rx.lifecycle();
      expect(Is.disposable(disposable)).to.be.true;
      expect(Is.disposable(life)).to.be.true;
    });

    it('Is.disposable: false', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => expect(Is.disposable(value)).to.eql(false));
    });
  });

  describe('Is.func', () => {
    it('Is.func: true', () => {
      function a() {}
      const b = () => null;
      expect(Is.func(a)).to.eql(true);
      expect(Is.func(b)).to.eql(true);
    });

    it('Is.func: false', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => expect(Is.func(value)).to.eql(false));
    });
  });

  describe('Is.number', () => {
    it('Is.number: true', () => {
      expect(Is.number(0)).to.eql(true);
      expect(Is.number(123)).to.eql(true);
    });

    it('Is.number: false', () => {
      const NON = ['', true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => expect(Is.number(value)).to.eql(false));
    });
  });

  describe('Is.string', () => {
    it('Is.string: true', () => {
      expect(Is.string('')).to.eql(true);
      expect(Is.string('hello')).to.eql(true);
    });

    it('Is.string: false', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => expect(Is.string(value)).to.eql(false));
    });
  });

  describe('Is.bool', () => {
    it('Is.bool: true', () => {
      expect(Is.bool(true)).to.eql(true);
      expect(Is.bool(false)).to.eql(true);
    });

    it('Is.bool: false', () => {
      const NON = [123, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => expect(Is.bool(value)).to.eql(false));
    });
  });

  describe('Is.array', () => {
    it('Is.array: true', () => {
      expect(Is.array([])).to.eql(true);
      expect(Is.array([123])).to.eql(true);
    });

    it('Is.array: false', () => {
      const NON = ['', true, null, undefined, BigInt(0), Symbol('foo'), {}];
      NON.forEach((value) => expect(Is.number(value)).to.eql(false));
    });
  });

  describe('Is.object', () => {
    it('Is.object: true', () => {
      expect(Is.object({})).to.eql(true);
      expect(Is.object([])).to.eql(true);
    });

    it('Is.object: false', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo')];
      NON.forEach((value) => expect(Is.object(value)).to.eql(false));
    });
  });

  describe('Is.record', () => {
    it('Is.record: true', () => {
      expect(Is.record({})).to.eql(true);
      expect(Is.record({ foo: 123 })).to.eql(true);
    });

    it('Is.record: false', () => {
      const NON = ['', 123, true, null, undefined, [], BigInt(0), Symbol('foo')];
      NON.forEach((value) => expect(Is.record(value)).to.eql(false));
    });
  });

  describe('Is.emptyRecord', () => {
    it('Is.emptyRecord: true', () => {
      expect(Is.emptyRecord({})).to.eql(true);
    });

    it('Is.emptyRecord: false', () => {
      const NON = ['', 123, true, null, undefined, [], { foo: 123 }, BigInt(0), Symbol('foo')];
      NON.forEach((value) => expect(Is.emptyRecord(value)).to.eql(false));
    });
  });

  describe('Is.localhost (non-browser)', () => {
    it('Is.localhost: false', () => {
      expect(Is.localhost()).to.eql(false);
    });
  });
});
