import { describe, expect, it } from '../../../-test.ts';
import { lines, text } from '../u.wrap.ts';

describe('Cli.Fmt.Text.Wrap', () => {
  describe('prose flow', () => {
    it('wraps prose with continuation indentation', () => {
      expect(lines('alpha beta gamma delta', {
        width: 12,
        continuationIndent: 2,
      })).to.eql(['alpha beta', '  gamma', '  delta']);
    });

    it('preserves first-line indent separately from continuation indent', () => {
      expect(lines('alpha beta gamma', {
        width: 12,
        indent: 2,
        continuationIndent: 4,
      })).to.eql(['  alpha beta', '    gamma']);
    });

    it('keeps a single over-width word atomic instead of fabricating splits', () => {
      expect(lines('alpha supercalifragilistic beta', {
        width: 10,
        continuationIndent: 2,
      })).to.eql(['alpha', '  supercalifragilistic', '  beta']);
    });

    it('makes wrap decisions using rendered terminal cells', () => {
      expect(lines('界界 ab', {
        width: 5,
        continuationIndent: 1,
      })).to.eql(['界界', ' ab']);

      expect(lines('👨‍👩‍👧‍👦 x', {
        width: 3,
        continuationIndent: 1,
      })).to.eql(['👨‍👩‍👧‍👦', ' x']);
    });
  });

  describe('source structure', () => {
    it('treats explicit source line breaks as continuations', () => {
      expect(lines('alpha beta\ngamma delta', {
        width: 40,
        continuationIndent: 2,
      })).to.eql(['alpha beta', '  gamma delta']);
    });

    it('preserves blank explicit source lines without indentation whitespace', () => {
      expect(lines('alpha beta\n\ngamma delta', {
        width: 40,
        continuationIndent: 2,
      })).to.eql(['alpha beta', '', '  gamma delta']);
    });

    it('disables soft wrapping when width is non-positive', () => {
      expect(lines('alpha beta', {
        width: 0,
        indent: 2,
      })).to.eql(['  alpha beta']);
    });
  });

  describe('preserved regions', () => {
    it('preserves fenced blocks while indenting them as continuations', () => {
      const input = ['Intro', '```text', 'alpha beta gamma delta', '```', 'Outro'].join('\n');

      expect(lines(input, { width: 12, continuationIndent: 2 })).to.eql([
        'Intro',
        '  ```text',
        '  alpha beta gamma delta',
        '  ```',
        '  Outro',
      ]);
    });

    it('preserves fenced blank lines without indentation whitespace', () => {
      const input = ['Intro', '```text', 'alpha', '', 'beta', '```', 'Outro'].join('\n');

      expect(lines(input, { width: 12, continuationIndent: 2 })).to.eql([
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

      expect(lines(`Run:\n${command}`, {
        width: 20,
        continuationIndent: 2,
      })).to.eql(['Run:', `  ${command}`]);
    });

    it('wraps prose lines that contain multiple backticked references', () => {
      expect(
        lines('`<config>` is an owner config reference; propose `./-config/example.yaml`.', {
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

      expect(lines(`Run:\n${command}`, {
        width: 20,
        continuationIndent: 2,
      })).to.eql(['Run:', `  ${command}`]);
    });

    it('preserves whole-line URLs by default', () => {
      const url = 'https://example.com/path/to/a/resource?with=query';

      expect(lines(`Open:\n${url}`, {
        width: 20,
        continuationIndent: 2,
      })).to.eql(['Open:', `  ${url}`]);
    });

    it('can disable default preservation when the caller wants prose wrapping', () => {
      expect(lines('$ alpha beta gamma', {
        width: 10,
        continuationIndent: 2,
        preserve: 'none',
      })).to.eql(['$ alpha', '  beta', '  gamma']);
    });

    it('accepts a custom whole-line preservation predicate', () => {
      expect(lines('Intro\nNOTE: alpha beta gamma delta', {
        width: 12,
        continuationIndent: 2,
        preserve: (line) => line.trimStart().startsWith('NOTE:'),
      })).to.eql(['Intro', '  NOTE: alpha beta gamma delta']);
    });
  });

  describe('text output', () => {
    it('joins wrapped lines with newlines', () => {
      expect(text('alpha beta gamma delta', {
        width: 12,
        continuationIndent: 2,
      })).to.eql('alpha beta\n  gamma\n  delta');
    });
  });
});
