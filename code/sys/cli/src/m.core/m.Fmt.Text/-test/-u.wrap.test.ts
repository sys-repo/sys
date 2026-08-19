import { describe, expect, it } from '../../../-test.ts';
import {
  MAX_TERMINAL_CELLS,
  MAX_TERMINAL_TEXT_LINES,
  MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS,
  MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS,
} from '../../u/u.layout.ts';
import { measure } from '../u.width.ts';
import { lines, text } from '../u.wrap.ts';

// Complete visible Grapheme_Cluster_Break=Prepend set from the current Segmenter/width proof.
const VISIBLE_PREPEND_SCALARS = [
  0x0d4e,
  0x111c2,
  0x111c3,
  0x113d1,
  0x1193f,
  0x11941,
  0x11a3a,
  0x11a84,
  0x11a85,
  0x11a86,
  0x11a87,
  0x11a88,
  0x11a89,
  0x11d46,
  0x11f02,
] as const;

const CONTEXTUAL_WORDS = [
  '\u0D4E',
  '\u0301',
  '🏽',
  '\u200D',
  '\u0903',
  '\u1161',
  '\u0600',
  '\uFE0F',
  '\u20E3',
  '👨‍👩‍👧‍👦',
  '\u001B[31m🏽\u001B[0m',
] as const;

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

    it('keeps ANSI controls transparent while accumulating word widths', () => {
      const colored = '\u001B[31m界界\u001B[0m';
      const linked = '\u001B]8;;https://example.com\u0007界界\u001B]8;;\u0007';
      const titled = '\u001B]0;hidden words here\u0007visible';
      const malformed = `${'\u001B]'.repeat((MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - 1) / 2)}x`;

      expect(lines(`${colored} ab`, { width: 5, continuationIndent: 1 })).to.eql([
        colored,
        ' ab',
      ]);
      expect(lines(`${linked} ab`, { width: 5, continuationIndent: 1 })).to.eql([
        linked,
        ' ab',
      ]);
      expect(lines(`${titled} tail`, {
        width: 11,
        continuationIndent: 1,
        preserve: 'none',
      })).to.eql([titled, ' tail']);
      expect(lines(malformed, { width: 80, preserve: 'none' })).to.eql([malformed]);
    });

    it('retains complete OSC bytes while normalizing only external line structure', () => {
      const controls = [
        '\u001B]0;hidden\nwords\t here\u0007',
        '\u001B]0;hidden\r\nwords\t here\u001B\\',
        '\u001B]0;hidden\nwords\t here\u009C',
      ];

      for (let index = 0; index < controls.length; index += 1) {
        const control = controls[index];
        expect(text(`\r\nalpha ${control} omega\r\n`, {
          width: 0,
          preserve: 'none',
        })).to.eql(`alpha ${control} omega`);
      }

      const adjacent = `${controls[0]}${controls[1]}${controls[2]}`;
      const earliestOpener = '\u001B]outer\n\u001B]inner\tvalue\u0007';
      expect(text(`alpha ${controls[0]} omega`, {
        width: 8,
        continuationIndent: 2,
        preserve: 'none',
      })).to.eql(`alpha ${controls[0]}\n  omega`);
      expect(text(`alpha ${adjacent} omega`, { width: 0, preserve: 'none' })).to.eql(
        `alpha ${adjacent} omega`,
      );
      expect(text(earliestOpener, { width: 0, preserve: 'none' })).to.eql(earliestOpener);
      expect(text('\r\nalpha\r\nbeta\n', {
        width: 0,
        continuationIndent: 2,
        preserve: 'none',
      })).to.eql('alpha\n  beta');
      expect(text('\u001B]unterminated\nwords', {
        width: 0,
        continuationIndent: 2,
        preserve: 'none',
      })).to.eql('\u001B]unterminated\n  words');
    });

    it('retains a maximum-length OSC as one source line', () => {
      const control = `\u001B]0;${'\n'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - 5)}\u0007`;

      expect(control.length).to.eql(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS);
      expect(lines(control, { width: 0, preserve: 'none' })).to.eql([control]);
      expect(text(control, { width: 0, preserve: 'none' })).to.eql(control);
    });

    it('measures normalized separators with both prior and following grapheme context', () => {
      const prepend = '\u001B[31m\u0D4E\u001B[0m';
      expect(measure(`${prepend} a`)).to.eql(2);
      expect(lines(`${prepend} a b`, { width: 2, preserve: 'none' })).to.eql([
        `${prepend} a`,
        'b',
      ]);

      for (let left = 0; left < CONTEXTUAL_WORDS.length; left += 1) {
        for (let right = 0; right < CONTEXTUAL_WORDS.length; right += 1) {
          const input = `a ${CONTEXTUAL_WORDS[left]} ${CONTEXTUAL_WORDS[right]} z`;
          for (let width = 1; width <= 8; width += 1) {
            expect(lines(input, { width, preserve: 'none' })).to.eql(
              referenceWholeFragmentLines(input, width),
            );
          }
        }
      }
    });

    it('carries every visible Prepend scalar across ANSI-transparent separators', () => {
      const indentation = [[0, 0], [1, 0], [0, 1], [2, 1]] as const;
      const leadingWhitespace = ['', ' ', '\u3000'] as const;

      for (let scalar = 0; scalar < VISIBLE_PREPEND_SCALARS.length; scalar += 1) {
        const character = String.fromCodePoint(VISIBLE_PREPEND_SCALARS[scalar]);
        expect(measure(character)).to.eql(1);

        for (let ansi = 0; ansi < 2; ansi += 1) {
          const word = ansi === 0 ? character : `\u001B[31m${character}\u001B[0m`;
          for (let leading = 0; leading < leadingWhitespace.length; leading += 1) {
            const input = `${leadingWhitespace[leading]}${word} a b`;
            for (let width = 1; width <= 5; width += 1) {
              for (let option = 0; option < indentation.length; option += 1) {
                const [indent, continuationIndent] = indentation[option];
                const options = { width, indent, continuationIndent, preserve: 'none' } as const;
                expect(lines(input, options)).to.eql(
                  referenceWholeFragmentLines(input, width, indent, continuationIndent),
                );
              }
            }
          }
        }
      }
    });

    it('keeps maximum contextual separator work inside the linear presentation envelope', () => {
      const prepend = '\u0D4E';
      const input = `${
        `${prepend} `.repeat((MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - 1) / 2)
      }${prepend}`;
      const output = lines(input, { width: 16_384, preserve: 'none' });

      expect(input.length).to.eql(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS);
      expect(output.length).to.eql(2);
      expect(output[0].length).to.eql(32_767);
      expect(output[1].length).to.eql(32_767);
      expect(measure(output[0])).to.eql(16_384);
      expect(measure(output[1])).to.eql(16_384);
      expect(output[0].length + 1 + output[1].length).to.eql(
        MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS,
      );

      const retainedTail = `${prepend.repeat(32_760)} ${'\u0301'.repeat(32_760)} b`;
      const retainedOutput = lines(retainedTail, { width: 1, preserve: 'none' });
      expect(retainedTail.length).to.eql(65_523);
      expect(retainedOutput.length).to.eql(2);
      expect(measure(retainedOutput[0])).to.eql(1);
      expect(measure(retainedOutput[1])).to.eql(1);
    });

    it('includes indentation and leading whitespace in first-word grapheme context', () => {
      const indentation = [[0, 0], [1, 0], [0, 1], [2, 1]] as const;
      const leadingWhitespace = ['', ' ', '\u3000'] as const;

      expect(lines('\u0301 \u0301 z', {
        width: 1,
        indent: 1,
        continuationIndent: 0,
        preserve: 'none',
      })).to.eql([' \u0301', '\u0301', 'z']);

      for (let index = 0; index < CONTEXTUAL_WORDS.length; index += 1) {
        const trailing = CONTEXTUAL_WORDS[(index + 3) % CONTEXTUAL_WORDS.length];
        for (let leading = 0; leading < leadingWhitespace.length; leading += 1) {
          const input = `${leadingWhitespace[leading]}${CONTEXTUAL_WORDS[index]} ${trailing} z`;
          for (let width = 1; width <= 6; width += 1) {
            for (let option = 0; option < indentation.length; option += 1) {
              const [indent, continuationIndent] = indentation[option];
              const options = { width, indent, continuationIndent, preserve: 'none' } as const;
              expect(lines(input, options)).to.eql(
                referenceWholeFragmentLines(input, width, indent, continuationIndent),
              );
            }
          }
        }
      }
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

    it('allows bounded wrapping to normalize an oversized unwrapped projection', () => {
      const input = `a${' '.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS - 2)}b`;

      expect(input.length).to.eql(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS);
      expect(lines(input, { width: 80, indent: 1, preserve: 'none' })).to.eql([' a b']);
    });

    it('bounds indentation allocation at the aggregate output ceiling', () => {
      const exact = lines('x', {
        width: 0,
        indent: MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS - 1,
      });
      const oversized = lines('alpha beta', {
        width: MAX_TERMINAL_CELLS + 1,
        indent: Number.MAX_VALUE,
        continuationIndent: MAX_TERMINAL_CELLS + 1,
      });

      expect(exact[0].length).to.eql(MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS);
      expect(() => lines('x', { width: 0, indent: MAX_TERMINAL_CELLS })).to.throw(
        'Cli.Fmt.Text finite presentation limit exceeded.',
      );
      expect(oversized).to.eql(['alpha beta']);
    });

    it('retains exact line semantics for the maximum admitted internal-newline candidate', () => {
      const input = `x${`\n${' '.repeat(15)}`.repeat(MAX_TERMINAL_TEXT_LINES - 1)}y`;
      const output = lines(input, { width: 0, preserve: 'none' });

      expect(input.length).to.eql(65_522);
      expect(output.length).to.eql(MAX_TERMINAL_TEXT_LINES);
      expect(output[0]).to.eql('x');
      expect(output[1]).to.eql('');
      expect(output[output.length - 1]).to.eql(`${' '.repeat(15)}y`);
    });

    it('bounds aggregate source, line, and joined-output work', () => {
      const exactSource = 'x'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS);
      expect(lines(exactSource, { width: 0 })).to.eql([exactSource]);

      const exactLines = `${'x\n'.repeat(MAX_TERMINAL_TEXT_LINES - 1)}x`;
      expect(lines(exactLines, { width: 0 }).length).to.eql(MAX_TERMINAL_TEXT_LINES);

      const exactIndent = MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS - 3;
      expect(text('x\ny', { width: 0, continuationIndent: exactIndent }).length).to.eql(
        MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS,
      );

      let preserveCalls = 0;
      const failures = [
        failureOf(() => lines('x'.repeat(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS + 1), { width: 0 })),
        failureOf(() => lines(`${'x\n'.repeat(MAX_TERMINAL_TEXT_LINES)}x`, { width: 0 })),
        failureOf(() => lines(`${'x '.repeat(MAX_TERMINAL_TEXT_LINES)}x`, { width: 1 })),
        failureOf(() =>
          lines('x\ny', {
            width: 0,
            continuationIndent: exactIndent + 1,
            preserve: () => {
              preserveCalls += 1;
              return true;
            },
          })
        ),
      ];

      expect(preserveCalls).to.eql(0);
      for (let index = 0; index < failures.length; index += 1) {
        expect((failures[index] as Error).message).to.eql(
          'Cli.Fmt.Text finite presentation limit exceeded.',
        );
        expect(failures[index]).to.equal(failures[0]);
      }
      expect(Object.isFrozen(failures[0])).to.eql(true);
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

    it('preflights fenced output using the opening fence indentation', () => {
      const fence = '```\nx\n```';
      const exactIndent = (MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS - fence.length) / 3;

      expect(lines(fence, {
        width: 0,
        indent: 0,
        continuationIndent: MAX_TERMINAL_CELLS,
      })).to.eql(['```', 'x', '```']);
      expect(lines(fence, {
        width: 0,
        indent: 2,
        continuationIndent: MAX_TERMINAL_CELLS,
      })).to.eql(['  ```', '  x', '  ```']);
      expect(lines(`intro\n${fence}`, {
        width: 0,
        continuationIndent: 2,
      })).to.eql(['intro', '  ```', '  x', '  ```']);

      expect(
        text(fence, {
          width: 0,
          indent: exactIndent,
          continuationIndent: MAX_TERMINAL_CELLS,
        }).length,
      ).to.eql(MAX_TERMINAL_TEXT_OUTPUT_CODE_UNITS);
      expect(() =>
        text('```\nxx\n```', {
          width: 0,
          indent: exactIndent,
          continuationIndent: MAX_TERMINAL_CELLS,
        })
      ).to.throw('Cli.Fmt.Text finite presentation limit exceeded.');
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

function referenceWholeFragmentLines(
  input: string,
  width: number,
  indent = 0,
  continuationIndent = 0,
): readonly string[] {
  const firstPrefix = ' '.repeat(indent);
  if (measure(`${firstPrefix}${input}`) <= width) return [`${firstPrefix}${input}`];

  const leading = input.match(/^\s*/)?.[0] ?? '';
  const words = input.trim().split(/\s+/);
  const output: string[] = [];
  let line = '';
  let currentIndent = indent;

  for (let index = 0; index < words.length; index += 1) {
    const next = line.length === 0 ? words[index] : `${line} ${words[index]}`;
    const prefix = `${' '.repeat(currentIndent)}${leading}`;
    if (line.length === 0 || measure(`${prefix}${next}`) <= width) {
      line = next;
    } else {
      output.push(`${prefix}${line}`);
      currentIndent = continuationIndent;
      line = words[index];
    }
  }
  if (line.length > 0) output.push(`${' '.repeat(currentIndent)}${leading}${line}`);
  return output;
}

function failureOf(operation: () => unknown): unknown {
  try {
    operation();
  } catch (cause) {
    return cause;
  }
}
