import { describe, expect, it, type t } from '../-test.ts';
import { Immutable } from '../m.Immutable/mod.ts';
import { Str } from './mod.ts';

describe('Str (Text)', () => {
  describe('Str.bytes', () => {
    it('converts to display string', () => {
      const bytes = 123557186;
      const a = Str.bytes(bytes);
      const b = Str.bytes(bytes, { maximumFractionDigits: 2 });
      const c = Str.bytes(1337);
      const d = Str.bytes(100);
      expect(a).to.eql('124 MB');
      expect(b).to.eql('123.56 MB');
      expect(c).to.eql('1.34 kB');
      expect(d).to.eql('100 B');
    });

    it('undefined → 0 B', () => {
      const a = Str.bytes();
      const b = Str.bytes(-1);

      expect(a).to.eql('0 B');
      expect(b).to.eql('-1 B');
    });

    it('{ space:false }', () => {
      const space = false;
      const a = Str.bytes(123, { space });
      const b = Str.bytes(0, { space });
      expect(a).to.eql('123B');
      expect(b).to.eql('0B');
    });
  });

  describe('Str.diff', () => {
    const assertDiff = (diff: t.TextDiff, index: number, delCount: number, newText?: string) => {
      expect(diff.index).to.eql(index);
      expect(diff.delCount).to.eql(delCount);
      expect(diff.newText).to.eql(newText);
    };

    it('no change', () => {
      const diff = Str.diff('foo', 'foo', 3);
      assertDiff(diff, 3, 0, '');
    });

    it('insert (single char)', () => {
      const diff1 = Str.diff('', 'a', 1);
      const diff2 = Str.diff('a', 'ab', 2);
      const diff3 = Str.diff('ab', 'acb', 2);
      assertDiff(diff1, 0, 0, 'a');
      assertDiff(diff2, 1, 0, 'b');
      assertDiff(diff3, 1, 0, 'c');
    });

    it('delete', () => {
      const diff1 = Str.diff('', 'abcd', 4);
      const diff2 = Str.diff('abcd', 'acd', 1);
      const diff3 = Str.diff('abc', 'a', 1);
      assertDiff(diff1, 0, 0, 'abcd');
      assertDiff(diff2, 1, 1, '');
      assertDiff(diff3, 1, 2, '');
    });

    it('replace all', () => {
      const diff1 = Str.diff('a', 'z', 1);
      const diff2 = Str.diff('abcd', 'z', 1);
      assertDiff(diff1, 0, 1, 'z');
      assertDiff(diff2, 0, 4, 'z');
    });
  });

  describe('Str.splice', () => {
    it('splice: new text', () => {
      const doc = { foo: {} };
      const path = ['foo', 'text'];

      Str.splice(doc, path, 0, 0, 'hello');
      expect(doc.foo).to.eql({ text: 'hello' });

      Str.splice(doc, path, 4, 0, ' n');
      expect(doc.foo).to.eql({ text: 'hell no' });
    });

    it('splice: delete', () => {
      const doc = { foo: { text: 'hello' } };
      const path = ['foo', 'text'];

      Str.splice(doc, path, 0, 1);
      expect(doc.foo).to.eql({ text: 'ello' });

      Str.splice(doc, path, 1, 2);
      expect(doc.foo).to.eql({ text: 'eo' });
    });

    it('splice: ImmutableRef<T>', () => {
      const doc = Immutable.clonerRef({ text: '' });

      const path = ['text'];
      doc.change((d) => Str.splice(d, path, 0, 0, 'hello'));
      expect(doc.current.text).to.eql('hello');

      doc.change((d) => Str.replace(d, path, ''));
      expect(doc.current.text).to.eql('');
    });

    it('diff then splice', () => {
      const doc = { text: 'hello' };
      const diff = Str.diff(doc.text, 'z', 1);
      Str.splice(doc, ['text'], diff.index, diff.delCount, diff.newText);
      expect(doc.text).to.eql('z');
    });

    it('throw: path is empty', () => {
      const doc = {};
      const fn = () => Str.splice(doc, [], 0, 0, 'hello');
      expect(fn).to.throw(/Target path is empty/);
    });

    it('throw: target parent not an object', () => {
      const doc = {};
      const fn = () => Str.splice(doc, ['foo', 'text'], 0, 0, 'hello');
      expect(fn).to.throw(/Target path "foo\.text" is not within an object/);
    });

    it('throw: target is not a string', () => {
      const test = (doc: any) => {
        const fn = () => Str.splice(doc, ['text'], 0, 0, 'hello');
        expect(fn).to.throw(/Target path "text" is not a string/);
      };
      const INVALID = [123, false, null, {}, [], Symbol('foo'), BigInt(0)];
      INVALID.forEach((text) => test({ text }));
    });
  });

  describe('Str.replace', () => {
    it('replace: "hello" → "foobar"', () => {
      const doc = { text: 'hello' };
      Str.replace(doc, ['text'], 'foobar');
      expect(doc).to.eql({ text: 'foobar' });
    });

    it('replace: "hello" → "" (clear)', () => {
      const doc = { text: 'hello' };
      Str.replace(doc, ['text'], '');
      expect(doc).to.eql({ text: '' });
    });
  });

  describe('Str.shorten', () => {
    it('empty', () => {
      expect(Str.shorten(undefined)).to.eql('');
      expect(Str.shorten('')).to.eql('');
      expect(Str.shorten('  ')).to.eql('  ');
    });

    it('invalid input (to string)', () => {
      const test = (input: any, expected: string) => {
        expect(Str.shorten(input)).to.eql(expected);
      };
      test(123, '123');
      test(null, 'null');
      test(undefined, '');
    });

    it('does not add ellipsis', () => {
      expect(Str.shorten('hello', 5)).to.eql('hello');
    });

    it('adds ellipsis', () => {
      expect(Str.shorten('hello', 4)).to.eql('hel…');
      expect(Str.shorten('hello', 4, { ellipsis: '...' })).to.eql('h...');
    });
  });

  describe('Str.caplitalize', () => {
    it('invalid input', () => {
      const NON = [123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => {
        expect(Str.capitalize(v)).to.eql(String(v));
      });
    });

    it('capitalizes a string', () => {
      expect(Str.capitalize('')).to.eql('');
      expect(Str.capitalize('  ')).to.eql('  ');
      expect(Str.capitalize('hello')).to.eql('Hello');
      expect(Str.capitalize('HeLLO')).to.eql('HeLLO');
    });
  });

  describe('Str.plural', () => {
    it('singular', () => {
      expect(Str.plural(1, 'item')).to.eql('item');
      expect(Str.plural(-1, 'item')).to.eql('item');
      expect(Str.plural(1, 'item', 'items')).to.eql('item');
      expect(Str.plural(-1, 'item', 'items')).to.eql('item');
    });

    it('plural', () => {
      expect(Str.plural(0, 'item', 'items')).to.eql('items');
      expect(Str.plural(2, 'item', 'items')).to.eql('items');
      expect(Str.plural(-2, 'item', 'items')).to.eql('items');
      expect(Str.plural(999, 'item', 'items')).to.eql('items');
    });

    it('inferred "s"', () => {
      expect(Str.plural(0, 'item')).to.eql('items');
      expect(Str.plural(2, 'item')).to.eql('items');
      expect(Str.plural(-2, 'item')).to.eql('items');
      expect(Str.plural(999, 'item')).to.eql('items');
    });
  });

  describe('Str.camelToKebab', () => {
    const test = (input: string, expected: string) => {
      expect(Str.camelToKebab(input)).to.eql(expected, input);
    };

    it('empty', () => {
      test('', '');
      test(' ', ' ');
    });

    it('invalid input', () => {
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => test(value, ''));
    });

    it('success: variants', () => {
      test('alreadykebab', 'alreadykebab');
      test('already-kebab', 'already-kebab');
      test('Already-kebab', 'already-kebab');
      test('kebab-case-string', 'kebab-case-string');

      test('camelCase', 'camel-case');
      test('thisIsATest', 'this-is-a-test');

      test('ABC', 'a-b-c');
      test('XMLHttpRequest', 'x-m-l-http-request');
      test('CamelCase', 'camel-case');
      test('-CamelCase', '-camel-case');
      test('--CamelCase', '--camel-case');
      test('--camelCase', '--camel-case');
      test('--camel-Case', '--camel-case');
    });
  });

  describe('String.truncate', () => {
    it('returns the original text when length is less than max', () => {
      expect(Str.truncate('abc', 5)).to.eql('abc');
    });

    it('returns the original text when length equals max', () => {
      expect(Str.truncate('hello', 5)).to.eql('hello');
    });

    it('truncates the text when length is greater than max', () => {
      // For max = 5, it takes the first 4 characters and appends an ellipsis.
      expect(Str.truncate('abcdef', 5)).to.eql('abcd…');
    });

    it('handles max = 1 correctly', () => {
      // For a string longer than 1, it returns just the ellipsis.
      expect(Str.truncate('abc', 1)).to.eql('…');
      // When the text length equals max, no truncation happens.
      expect(Str.truncate('a', 1)).to.eql('a');
    });

    it('returns an empty string when given an empty string', () => {
      expect(Str.truncate('', 3)).to.eql('');
    });

    it('handles edge case when max is 0', () => {
      // With max = 0, "abc" becomes "abc".slice(0, -1) which is "ab", then an ellipsis is appended.
      expect(Str.truncate('abc', 0)).to.eql('ab…');
    });

    it('handles undefined', () => {
      expect(Str.truncate(undefined, 5)).to.eql('');
      expect(Str.truncate(undefined, 0)).to.eql('');
    });
  });

  describe('Str.Lorem', () => {
    const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor suscipit. Integer lacinia sapien at ante tempus volutpat.`;

    it('Lorem.text | toString', () => {
      expect(Str.Lorem.text).to.eql(LOREM);
      expect(Str.Lorem.toString()).to.eql(LOREM);
      expect(String(Str.Lorem)).to.eql(LOREM);
    });

    it('Str.lorem (string)', () => {
      expect(Str.lorem).to.eql(Str.Lorem.text);
    });
  });
});
