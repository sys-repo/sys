import { describe, expect, it } from '../../../-test.ts';
import { wrap, wrapLines } from '../u.wrap.ts';

describe('Cli.Fmt.Text.wrap', () => {
  describe('prose flow', () => {
    it('wraps prose with continuation indentation', () => {
      expect(wrapLines('alpha beta gamma delta', {
        width: 12,
        continuationIndent: 2,
      })).to.eql(['alpha beta', '  gamma', '  delta']);
    });

    it('preserves first-line indent separately from continuation indent', () => {
      expect(wrapLines('alpha beta gamma', {
        width: 12,
        indent: 2,
        continuationIndent: 4,
      })).to.eql(['  alpha beta', '    gamma']);
    });

    it('keeps a single over-width word atomic instead of fabricating splits', () => {
      expect(wrapLines('alpha supercalifragilistic beta', {
        width: 10,
        continuationIndent: 2,
      })).to.eql(['alpha', '  supercalifragilistic', '  beta']);
    });

    it('makes wrap decisions using rendered terminal cells', () => {
      expect(wrapLines('界界 ab', {
        width: 5,
        continuationIndent: 1,
      })).to.eql(['界界', ' ab']);

      expect(wrapLines('👨‍👩‍👧‍👦 x', {
        width: 3,
        continuationIndent: 1,
      })).to.eql(['👨‍👩‍👧‍👦', ' x']);
    });
  });

  describe('source structure', () => {
    it('treats explicit source line breaks as continuations', () => {
      expect(wrapLines('alpha beta\ngamma delta', {
        width: 40,
        continuationIndent: 2,
      })).to.eql(['alpha beta', '  gamma delta']);
    });

    it('preserves blank explicit source lines without indentation whitespace', () => {
      expect(wrapLines('alpha beta\n\ngamma delta', {
        width: 40,
        continuationIndent: 2,
      })).to.eql(['alpha beta', '', '  gamma delta']);
    });

    it('disables soft wrapping when width is non-positive', () => {
      expect(wrapLines('alpha beta', {
        width: 0,
        indent: 2,
      })).to.eql(['  alpha beta']);
    });
  });

  describe('preserved regions', () => {
    it('preserves fenced blocks while indenting them as continuations', () => {
      const text = ['Intro', '```text', 'alpha beta gamma delta', '```', 'Outro'].join('\n');

      expect(wrapLines(text, { width: 12, continuationIndent: 2 })).to.eql([
        'Intro',
        '  ```text',
        '  alpha beta gamma delta',
        '  ```',
        '  Outro',
      ]);
    });

    it('preserves fenced blank lines without indentation whitespace', () => {
      const text = ['Intro', '```text', 'alpha', '', 'beta', '```', 'Outro'].join('\n');

      expect(wrapLines(text, { width: 12, continuationIndent: 2 })).to.eql([
        'Intro',
        '  ```text',
        '  alpha',
        '',
        '  beta',
        '  ```',
        '  Outro',
      ]);
    });

    it('preserves whole-line command references by default', () => {
      const command = '`deno run -ERWN jsr:@sys/cell start . --mode production`.';

      expect(wrapLines(`Run:\n${command}`, {
        width: 20,
        continuationIndent: 2,
      })).to.eql(['Run:', `  ${command}`]);
    });

    it('wraps prose lines that contain multiple backticked references', () => {
      expect(
        wrapLines('`<config>` is an owner config reference; propose `./-config/example.yaml`.', {
          width: 34,
          continuationIndent: 2,
        }),
      ).to.eql([
        '`<config>` is an owner config',
        '  reference; propose',
        '  `./-config/example.yaml`.',
      ]);
    });

    it('preserves whole-line Deno commands by default', () => {
      const command = 'deno task test --trace-leaks ./src/m.core/m.Fmt.Text';

      expect(wrapLines(`Run:\n${command}`, {
        width: 20,
        continuationIndent: 2,
      })).to.eql(['Run:', `  ${command}`]);
    });

    it('preserves whole-line URLs by default', () => {
      const url = 'https://example.com/path/to/a/resource?with=query';

      expect(wrapLines(`Open:\n${url}`, {
        width: 20,
        continuationIndent: 2,
      })).to.eql(['Open:', `  ${url}`]);
    });

    it('can disable default preservation when the caller wants prose wrapping', () => {
      expect(wrapLines('$ alpha beta gamma', {
        width: 10,
        continuationIndent: 2,
        preserve: 'none',
      })).to.eql(['$ alpha', '  beta', '  gamma']);
    });

    it('accepts a custom whole-line preservation predicate', () => {
      expect(wrapLines('Intro\nNOTE: alpha beta gamma delta', {
        width: 12,
        continuationIndent: 2,
        preserve: (line) => line.trimStart().startsWith('NOTE:'),
      })).to.eql(['Intro', '  NOTE: alpha beta gamma delta']);
    });
  });

  describe('string output', () => {
    it('joins wrapped lines with newlines', () => {
      expect(wrap('alpha beta gamma delta', {
        width: 12,
        continuationIndent: 2,
      })).to.eql('alpha beta\n  gamma\n  delta');
    });
  });
});
