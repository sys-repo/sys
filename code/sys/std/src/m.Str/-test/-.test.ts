import { describe, expect, it, type t } from '../../-test.ts';
import { Str } from '../mod.ts';

describe('Str (String)', () => {
  describe('Str.bytes', () => {
    it('converts to display string', () => {
      const bytes = 123557186;
      const a = Str.bytes(bytes);
      const b = Str.bytes(bytes, { maximumFractionDigits: 2 });
      const c = Str.bytes(1337);
      const d = Str.bytes(100);
      expect(a).to.eql('124 MB');
      expect(b).to.eql('123.55 MB');
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

  describe('Str.truncate', () => {
    it('returns the original text when length is less than max', () => {
      expect(Str.truncate('abc', 5)).to.eql('abc');
    });

    it('returns the original text when length equals max', () => {
      expect(Str.truncate('hello', 5)).to.eql('hello');
    });

    it('truncates the text when length is greater than max', () => {
      // For max = 5, it takes the first (max - ellipsis.length) characters and appends the ellipsis.
      expect(Str.truncate('abcdef', 5)).to.eql('abcd…');
    });

    it('handles max = 1 correctly', () => {
      // For a string longer than 1, with a single-char ellipsis, result is just the ellipsis.
      expect(Str.truncate('abc', 1)).to.eql('…');
      // When the text length equals max, no truncation happens.
      expect(Str.truncate('a', 1)).to.eql('a');
    });

    it('returns an empty string when given an empty string', () => {
      expect(Str.truncate('', 3)).to.eql('');
    });

    it('returns an empty string when max = 0', () => {
      // New behavior: never produce negative slices; with max <= 0, return ''.
      expect(Str.truncate('abc', 0)).to.eql('');
    });

    it('handles undefined input safely', () => {
      expect(Str.truncate(undefined, 5)).to.eql('');
      expect(Str.truncate(undefined, 0)).to.eql('');
    });

    it('respects custom multi-character ellipsis', () => {
      // max = 5, ellipsis = '...' (len 3) → keep first 2 chars + '...'
      expect(Str.truncate('abcdef', 5, { ellipsis: '...' })).to.eql('ab...');
    });
  });

  describe('Str.ellipsize', () => {
    const E = '…';

    describe('scalar max', () => {
      it('returns original when length <= max', () => {
        expect(Str.ellipsize('abc', 3)).to.eql('abc');
        expect(Str.ellipsize('abc', 4)).to.eql('abc');
        expect(Str.ellipsize('', 5)).to.eql('');
        expect(Str.ellipsize(undefined, 5)).to.eql('');
      });

      it('centers the ellipsis (even split)', () => {
        // remain = 6 → start=3, end=3
        expect(Str.ellipsize('abcdefghij', 7)).to.eql(`abc${E}hij`);
      });

      it('centers the ellipsis (odd split favors start)', () => {
        // remain = 5 → start=3, end=2
        expect(Str.ellipsize('abcdefghij', 6)).to.eql(`abc${E}ij`);
      });

      it('tiny max values', () => {
        expect(Str.ellipsize('abcdef', 1)).to.eql(E); // ellipsis only
        expect(Str.ellipsize('abcdef', 0)).to.eql(''); // no budget
      });

      it('custom ellipsis (scalar)', () => {
        // remain = 6 → start=3, end=3
        expect(Str.ellipsize('abcdefghij', 8, { ellipsis: '--' })).to.eql('abc--hij');
      });

      it('custom ellipsis - as string parameter', () => {
        // remain = 6 → start=3, end=3
        expect(Str.ellipsize('abcdefghij', 8, '..')).to.eql('abc..hij');
      });

      it('non-finite or negative max → empty', () => {
        expect(Str.ellipsize('abcdef', Number.NaN as unknown as number)).to.eql('');
        expect(Str.ellipsize('abcdef', -5)).to.eql('');
      });
    });

    describe('tuple max = [left, right]', () => {
      const text = 'https://domain.com/path/to/file';

      it('returns original when text fits within budget', () => {
        // budget = 10 + 10 + 1 = 21; text length < 21? If not, choose a short text:
        expect(Str.ellipsize('short-file.txt', [8, 8])).to.eql('short-file.txt');
      });

      it('keeps exact left/right with default ellipsis', () => {
        // budget = 12 + 8 + 1 = 21
        const out = Str.ellipsize(text, [12, 8]);
        expect(out).to.eql(`${text.slice(0, 12)}${E}${text.slice(text.length - 8)}`);
      });

      it('right-only or left-only', () => {
        expect(Str.ellipsize(text, [12, 0])).to.eql(`${text.slice(0, 12)}${E}`);
        expect(Str.ellipsize(text, [0, 10])).to.eql(`${E}${text.slice(text.length - 10)}`);
      });

      it('zero/zero → ellipsis only (default)', () => {
        expect(Str.ellipsize(text, [0, 0])).to.eql(E);
      });

      it('custom ellipsis (tuple)', () => {
        const ell = '---';
        const out = Str.ellipsize(text, [8, 6], { ellipsis: ell });
        expect(out).to.eql(`${text.slice(0, 8)}${ell}${text.slice(text.length - 6)}`);
      });

      it('text longer than [left,right] budget → left + ellipsis + right', () => {
        // With tuple max, output is exactly left + ellipsis + right when truncation is needed.
        const txt = 'abcdefghijklmnop'; // 16 chars
        const out = Str.ellipsize(txt, [2, 1], { ellipsis: '==========' }); // budget = 13 < 16
        expect(out).to.eql('ab==========p');
      });

      it('guards against over-budget ends (stability)', () => {
        // Even if implementation changes, result must not exceed budget length
        const left = 50,
          right = 50; // huge requests
        const ell = '..';
        const budget = left + right + ell.length; // 102
        const res = Str.ellipsize('0123456789', [left, right], { ellipsis: ell });
        expect(res.length <= budget).to.eql(true);
      });
    });
  });

  describe('Str.Lorem', () => {
    const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor suscipit. Integer lacinia sapien at ante tempus volutpat.`;
    const Lorem = Str.Lorem;

    it('Str.lorem (string)', () => {
      expect(Str.lorem).to.eql(Str.Lorem.text);
    });

    it('Lorem.text | toString', () => {
      expect(Str.Lorem.text).to.eql(LOREM);
      expect(Str.Lorem.toString()).to.eql(LOREM);
      expect(String(Str.Lorem)).to.eql(LOREM);
    });

    describe('Str.Lorem.words', () => {
      it('should return an empty string when count is negative', () => {
        const result = Str.Lorem.words(-5);
        expect(result).to.equal('');
      });

      it('should return an empty string when count is zero', () => {
        const result = Str.Lorem.words(0);
        expect(result).to.equal('');
      });

      it('should return the first N words with a trailing period when count > 0', () => {
        // For example, if count = 5, we expect the result to have 5 words and end with a period.
        const count = 5;
        const result = Str.Lorem.words(count);

        // Remove the final character (period) to check the word count.
        const words = result.split(' ');
        expect(words.length).to.equal(count);
        expect(result.endsWith('.')).to.be.true;
      });

      it('should repeat the text if count exceeds the total number of words', () => {
        const count = 1000;
        const result = Str.Lorem.words(count);

        // Remove the trailing period (if present) and split the result into words.
        const resultWords = result.endsWith('.')
          ? result.slice(0, -1).split(' ')
          : result.split(' ');
        expect(resultWords.length).to.equal(count);

        // Get the original words from Lorem.text (removing the trailing period).
        const originalWords = Str.Lorem.text.endsWith('.')
          ? Str.Lorem.text.slice(0, -1).split(' ')
          : Str.Lorem.text.split(' ');

        const trimPeriod = (input: string) => input.replace(/\.$/, '');

        // Verify that the output words repeat the original words in sequence.
        for (let i = 0; i < resultWords.length; i++) {
          const a = resultWords[i];
          const b = originalWords[i % originalWords.length];
          expect(trimPeriod(a)).to.equal(trimPeriod(b));
        }

        // Ensure the result ends with a period.
        expect(result.endsWith('.')).to.be.true;
      });

      it('words - no param', () => {
        const result = Str.Lorem.words();
        expect(result.split(' ').length).to.eql(Lorem.text.split(' ').length);
      });
    });
  });

  describe('Str.replaceAll', () => {
    it('replaces all occurrences when pattern is string', () => {
      const input = 'foo foo foo';
      const { changed, before, after } = Str.replaceAll(input, 'foo', 'bar');
      expect(before).to.eql(input);
      expect(after).to.eql('bar bar bar');
      expect(changed).to.be.true;
    });

    it('return no change when pattern does not match', () => {
      const input = 'hello world';
      const { changed, after } = Str.replaceAll(input, 'xyz', '123');
      expect(after).to.eql(input);
      expect(changed).to.be.false;
    });

    it('replaces all occurrences when pattern is regex without g flag', () => {
      const input = 'banana';
      const { after } = Str.replaceAll(input, /a/, 'o');

      // Without g, native replace would only replace first "a",
      // but our normalizeRegex adds "g" so all "a"s become "o".
      expect(after).to.eql('bonono');
    });

    it('replace ignoring case when regex has i flag', () => {
      const input = 'Foo foo FOO';
      const { after } = Str.replaceAll(input, /foo/gi, 'bar');
      expect(after).to.eql('bar bar bar');
    });

    it('supports multiline patterns for string patterns', () => {
      const input = 'start\nstart\nmiddle\nstart';
      const { after } = Str.replaceAll(input, '^start', 'X');

      // string pattern compiles to /ˆstart/gm, so it hits each line.
      expect(after).to.eql('X\nX\nmiddle\nX');
    });
  });

  describe('Str.indent', () => {
    it('returns original string when empty or chars <= 0', () => {
      const input = 'line';
      expect(Str.indent('', 2)).to.equal('');
      expect(Str.indent(input, 0)).to.equal(input);
      expect(Str.indent(input, -2)).to.equal(input);
    });

    it('adds space indentation to all non-blank lines', () => {
      const input = 'one\n  two\nthree';
      const result = Str.indent(input, 2);

      expect(result).to.eql('  one\n    two\n  three');
    });

    it('preserves blank and whitespace-only lines', () => {
      const input = 'one\n\n  \n two\n';
      const result = Str.indent(input, 2);

      // middle blank lines unchanged, non-blank indented
      expect(result).to.eql('  one\n\n  \n   two\n');
    });

    it('uses custom indent character when provided', () => {
      const input = 'one\ntwo';
      const result = Str.indent(input, 3, { char: '.' });

      expect(result).to.eql('...one\n...two');
    });
  });

  describe('Str.dedent', () => {
    it('removes shared leading indentation', () => {
      const input = `
          foo:
            id: example-slug
            props:
              src: "video.mp4"
    `;
      const res = Str.dedent(input);
      expect(res).to.eql(`foo:
  id: example-slug
  props:
    src: "video.mp4"`);
    });

    it('preserves relative indentation', () => {
      const input = `
        a:
          b:
            c: 1
      `;
      const res = Str.dedent(input);
      expect(res).to.eql(`a:
  b:
    c: 1`);
    });

    it('handles empty or whitespace-only strings', () => {
      expect(Str.dedent('')).to.eql('');
      expect(Str.dedent('\n')).to.eql('');
      expect(Str.dedent('   \n   ')).to.eql('   \n   ');
    });

    it('handles strings with no indentation', () => {
      const input = 'foo:\n  bar: 1';
      expect(Str.dedent(input)).to.eql(input);
    });

    it('ignores leading blank line when measuring indent', () => {
      const input = `
      one
        two
    `;
      const res = Str.dedent(input);
      expect(res).to.eql(`one\n  two`);
    });
  });

  describe('Str.trimEdgeNewlines', () => {
    const fn = Str.trimEdgeNewlines;

    it('returns empty string for undefined or empty input', () => {
      expect(fn()).to.equal('');
      expect(fn('')).to.equal('');
    });

    it('removes pure leading and trailing newlines', () => {
      const input = '\n\nfoo\nbar\n\n';
      expect(fn(input)).to.equal('foo\nbar');
    });

    it('removes whitespace-only lines at top and bottom', () => {
      const input = '   \n\t \nfoo\nbar\n  \n ';
      expect(fn(input)).to.equal('foo\nbar');
    });

    it('preserves indentation and internal spacing', () => {
      const input = '\n  foo\n  bar\n\n';
      expect(fn(input)).to.equal('  foo\n  bar');
    });

    it('handles Windows CRLF newlines', () => {
      const input = '\r\n\r\nfoo\r\nbar\r\n\r\n';
      expect(fn(input)).to.equal('foo\nbar');
    });

    it('does not modify text without edge padding', () => {
      const input = 'foo\nbar';
      expect(fn(input)).to.equal('foo\nbar');
    });

    it('preserves trailing spaces on the final content line', () => {
      const input = '\nfoo  \n\n';
      expect(fn(input)).to.equal('foo  ');
    });

    it('trims only edge blank lines when surrounded by content', () => {
      const input = '\n\nfoo\n\nbar\n\n';
      expect(fn(input)).to.equal('foo\n\nbar');
    });
  });

  describe('Str.trimTrailingSlashes', () => {
    it('removes trailing slashes only', () => {
      expect(Str.trimTrailingSlashes('foo/')).to.equal('foo');
      expect(Str.trimTrailingSlashes('foo///')).to.equal('foo');
      expect(Str.trimTrailingSlashes('foo/bar/')).to.equal('foo/bar');
    });

    it('preserves leading and internal slashes', () => {
      expect(Str.trimTrailingSlashes('/foo/bar/')).to.equal('/foo/bar');
      expect(Str.trimTrailingSlashes('/foo//bar//')).to.equal('/foo//bar');
    });

    it('is safe for empty or slash-only input', () => {
      expect(Str.trimTrailingSlashes('')).to.equal('');
      expect(Str.trimTrailingSlashes('/')).to.equal('');
      expect(Str.trimTrailingSlashes('///')).to.equal('');
    });
  });

  describe('Str.trimSlashes', () => {
    it('removes both leading and trailing slashes', () => {
      expect(Str.trimSlashes('/foo/')).to.equal('foo');
      expect(Str.trimSlashes('///foo///')).to.equal('foo');
      expect(Str.trimSlashes('/foo/bar/')).to.equal('foo/bar');
    });

    it('preserves internal slashes', () => {
      expect(Str.trimSlashes('/foo//bar/')).to.equal('foo//bar');
    });

    it('is safe for empty or slash-only input', () => {
      expect(Str.trimSlashes('')).to.equal('');
      expect(Str.trimSlashes('/')).to.equal('');
      expect(Str.trimSlashes('///')).to.equal('');
    });
  });

  describe('Str.trimHttpScheme', () => {});

  describe('Str.trimLeadingSlashes', () => {
    it('removes a single leading slash', () => {
      expect(Str.trimLeadingSlashes('/foo')).to.equal('foo');
    });

    it('removes multiple leading slashes', () => {
      expect(Str.trimLeadingSlashes('///foo')).to.equal('foo');
    });

    it('does not remove internal slashes', () => {
      expect(Str.trimLeadingSlashes('/foo/bar')).to.equal('foo/bar');
    });

    it('does not remove trailing slashes', () => {
      expect(Str.trimLeadingSlashes('/foo/')).to.equal('foo/');
    });

    it('returns the same string if there are no leading slashes', () => {
      expect(Str.trimLeadingSlashes('foo/bar')).to.equal('foo/bar');
    });

    it('returns empty string for empty input', () => {
      expect(Str.trimLeadingSlashes('')).to.equal('');
    });

    it('handles root slash by returning empty string', () => {
      expect(Str.trimLeadingSlashes('/')).to.equal('');
    });

    it('handles multiple slashes only', () => {
      expect(Str.trimLeadingSlashes('////')).to.equal('');
    });
  });

  describe('Str.trimHttpScheme', () => {
    it('removes http://', () => {
      expect(Str.trimHttpScheme('http://example.com')).to.equal('example.com');
    });

    it('removes https://', () => {
      expect(Str.trimHttpScheme('https://example.com')).to.equal('example.com');
    });

    it('removes scheme only once', () => {
      expect(Str.trimHttpScheme('https://http://example.com')).to.equal('http://example.com');
    });

    it('leaves strings without http scheme unchanged', () => {
      expect(Str.trimHttpScheme('example.com')).to.equal('example.com');
    });

    it('handles empty string', () => {
      expect(Str.trimHttpScheme('')).to.equal('');
    });

    it('handles undefined safely', () => {
      expect(Str.trimHttpScheme(undefined)).to.equal('');
    });
  });

  describe('Str.trimLeadingDotSlash', () => {
    it('removes a single leading ./', () => {
      expect(Str.trimLeadingDotSlash('./foo')).to.equal('foo');
    });

    it('removes repeated leading ./ segments', () => {
      expect(Str.trimLeadingDotSlash('././foo')).to.equal('foo');
      expect(Str.trimLeadingDotSlash('./././foo')).to.equal('foo');
    });

    it('does not affect internal ./ segments', () => {
      expect(Str.trimLeadingDotSlash('foo/./bar')).to.equal('foo/./bar');
    });

    it('does not affect trailing ./ segments', () => {
      expect(Str.trimLeadingDotSlash('foo/.')).to.equal('foo/.');
    });

    it('leaves strings without leading ./ unchanged', () => {
      expect(Str.trimLeadingDotSlash('foo/bar')).to.equal('foo/bar');
    });

    it('handles leading slashes separately (no cross-trimming)', () => {
      expect(Str.trimLeadingDotSlash('/./foo')).to.equal('/./foo');
    });

    it('handles empty and undefined input safely', () => {
      expect(Str.trimLeadingDotSlash('')).to.equal('');
      expect(Str.trimLeadingDotSlash(undefined)).to.equal('');
    });
  });

  describe('Str.stripPrefixOnce', () => {
    it('removes the prefix when it appears at the start', () => {
      expect(Str.stripPrefixOnce('foo/bar', 'foo/')).to.eql('bar');
    });

    it('does nothing if the prefix does not match exactly', () => {
      expect(Str.stripPrefixOnce('foo/bar', 'bar/')).to.eql('foo/bar');
    });

    it('removes the prefix only once (not repeatedly)', () => {
      expect(Str.stripPrefixOnce('foo/foo/bar', 'foo/')).to.eql('foo/bar');
    });

    it('is a no-op when the string equals the prefix', () => {
      expect(Str.stripPrefixOnce('foo', 'foo')).to.eql('');
    });

    it('does not remove partial or mid-string matches', () => {
      expect(Str.stripPrefixOnce('myfoo/bar', 'foo')).to.eql('myfoo/bar');
    });

    it('handles empty input safely', () => {
      expect(Str.stripPrefixOnce('', 'foo')).to.eql('');
    });

    it('handles empty prefix as a no-op', () => {
      expect(Str.stripPrefixOnce('foo/bar', '')).to.eql('foo/bar');
    });

    it('is safe for undefined input', () => {
      expect(Str.stripPrefixOnce(undefined, 'foo')).to.eql('');
    });
  });

  describe('Str.count', () => {
    it('returns 0 when substring is not found', () => {
      expect(Str.count('hello world', 'xyz')).eql(0);
    });

    it('counts non-overlapping occurrences', () => {
      expect(Str.count('foo bar foo baz foo', 'foo')).eql(3);
    });

    it('works with single-character substrings', () => {
      expect(Str.count('banana', 'a')).eql(3);
    });

    it('returns 0 when substring is empty', () => {
      // Important: empty substring is undefined behaviour in split().
      // We define it explicitly as returning 0.
      expect(Str.count('abc', '')).eql(0);
    });

    it('handles substring at the start', () => {
      expect(Str.count('foo123', 'foo')).eql(1);
    });

    it('handles substring at the end', () => {
      expect(Str.count('123foo', 'foo')).eql(1);
    });

    it('handles repeated adjacent substrings', () => {
      expect(Str.count('foofoofoo', 'foo')).eql(3);
    });

    it('is literal and does not treat substring as regex', () => {
      expect(Str.count('a.c a.c a.c', 'a.c')).eql(3);
    });

    it('handles unicode correctly (non-overlapping)', () => {
      expect(Str.count('🧠x🧠y🌳', '🧠')).eql(2);
    });

    it('returns 0 for missing unicode substrings', () => {
      expect(Str.count('🐚🐚', '💧')).eql(0);
    });
  });
});
