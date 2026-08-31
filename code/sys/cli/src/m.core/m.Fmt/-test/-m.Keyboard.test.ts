import { c, describe, expect, it, type t } from '../../../-test.ts';
import { Cli, Fmt } from '../../mod.ts';
import {
  MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS,
  MAX_WIDTH_COLLECTION_LENGTH,
} from '../../u/u.layout.ts';

const open = Fmt.Keyboard.command({ label: 'open', keys: ['o'] });
const openBrowser = Fmt.Keyboard.command({
  label: 'open',
  keys: ['o'],
  context: 'browser',
});
const quit = Fmt.Keyboard.command({ label: 'quit', keys: ['q'] });
const candidates = [
  { left: openBrowser, right: quit },
  { left: open, right: quit },
];

describe('Cli.Fmt.Keyboard', () => {
  describe('.command', () => {
    it('renders the keyboard command grammar with authored key order and optional context', () => {
      const single = Fmt.Keyboard.command({ label: 'quit', keys: ['q'] });
      const alternatives = Fmt.Keyboard.command({
        label: 'quit',
        keys: ['ctrl + c', 'q'],
      });
      const contextual = Fmt.Keyboard.command({
        label: 'open',
        keys: ['o'],
        context: 'browser',
      });

      expect(single).to.eql(`${c.dim(c.gray('quit:'))} ${c.bold(c.white('q'))}`);
      expect(alternatives).to.eql(
        `${c.dim(c.gray('quit:'))} ${c.bold(c.white('ctrl + c'))} ${c.dim(c.gray('or'))} ${
          c.bold(c.white('q'))
        }`,
      );
      expect(contextual).to.eql(
        `${c.dim(c.gray('open:'))} ${c.bold(c.white('o'))} ${c.dim(c.gray('(browser)'))}`,
      );
      expect(Cli.stripAnsi(single)).to.eql('quit: q');
      expect(Cli.stripAnsi(alternatives)).to.eql('quit: ctrl + c or q');
      expect(Cli.stripAnsi(contextual)).to.eql('open: o (browser)');
    });

    it('bounds collection work and aggregate output before final composition', () => {
      let excessiveEntryReads = 0;
      const excessiveKeys = new Proxy([] as string[], {
        get(_target, key) {
          if (key === 'length') return MAX_WIDTH_COLLECTION_LENGTH + 1;
          excessiveEntryReads += 1;
          return 'q';
        },
      }) as [first: string, ...rest: string[]];
      expect(() => Fmt.Keyboard.command({ label: 'quit', keys: excessiveKeys })).to.throw(
        'Cli.Fmt.Text finite presentation limit exceeded.',
      );
      expect(excessiveEntryReads).to.eql(0);

      let invalidEntryReads = 0;
      const invalidKeys = new Proxy([] as string[], {
        get(_target, key) {
          if (key === 'length') return Number.POSITIVE_INFINITY;
          invalidEntryReads += 1;
          return 'q';
        },
      }) as [first: string, ...rest: string[]];
      expect(() => Fmt.Keyboard.command({ label: 'quit', keys: invalidKeys })).to.throw(
        'Cli.Fmt.Keyboard input length invalid.',
      );
      expect(invalidEntryReads).to.eql(0);

      const key = 'a'.repeat(
        Math.floor(MAX_TERMINAL_TEXT_SOURCE_CODE_UNITS / MAX_WIDTH_COLLECTION_LENGTH),
      );
      const outputHeavyKeys = new Array<string>(MAX_WIDTH_COLLECTION_LENGTH).fill(key) as [
        first: string,
        ...rest: string[],
      ];
      expect(() => Fmt.Keyboard.command({ label: '', keys: outputHeavyKeys })).to.throw(
        'Cli.Fmt.Text finite presentation limit exceeded.',
      );
    });
  });

  describe('.row', () => {
    it('selects complete candidates at the exact full, compact, and omitted boundaries', () => {
      expect(Fmt.Keyboard.row({ width: 26, candidates })).to.eql(`${openBrowser}  ${quit}`);
      expect(Fmt.Keyboard.row({ width: 25, candidates })).to.eql(`${open}${' '.repeat(11)}${quit}`);
      expect(Fmt.Keyboard.row({ width: 16, candidates })).to.eql(`${open}  ${quit}`);
      expect(Fmt.Keyboard.row({ width: 15, candidates })).to.eql(undefined);
      expect(
        Fmt.Keyboard.row({
          width: 10,
          candidates: [
            { left: 'aaaa', right: 'rrrrrr' },
            { left: 'b', right: 'cc' },
          ],
        }),
      ).to.eql(`b${' '.repeat(7)}cc`);
    });

    it('floors only admitted explicit widths and refuses invalid widths without fallback', () => {
      expect(Fmt.Keyboard.row({ width: 15.9, candidates })).to.eql(undefined);
      expect(Fmt.Keyboard.row({ width: 0, candidates })).to.eql(undefined);
      expect(Fmt.Keyboard.row({ width: -1, candidates })).to.eql(undefined);
      expect(Fmt.Keyboard.row({ width: Number.NaN, candidates })).to.eql(undefined);
      expect(Fmt.Keyboard.row({ width: Infinity, candidates })).to.eql(undefined);
      expect(Fmt.Keyboard.row({ width: 65_536, candidates })).to.eql(undefined);
    });

    it('propagates presentation-authority refusal instead of omitting rows', () => {
      const descriptor = Object.getOwnPropertyDescriptor(Math, 'abs');
      if (!descriptor || !('value' in descriptor)) {
        throw new Error('Math.abs descriptor is required.');
      }

      Object.defineProperty(Math, 'abs', { ...descriptor, value: () => 0 });
      try {
        expect(() => Fmt.Keyboard.command({ label: 'quit', keys: ['q'] })).to.throw(
          'Cli.Fmt.Text presentation authority unavailable.',
        );
        expect(() => Fmt.Keyboard.row({ width: 80, candidates: [] })).to.throw(
          'Cli.Fmt.Text presentation authority unavailable.',
        );
      } finally {
        Object.defineProperty(Math, 'abs', descriptor);
      }
    });

    it('transactionally re-admits caller-owned command and row getters', () => {
      const descriptor = Object.getOwnPropertyDescriptor(Math, 'abs');
      if (!descriptor || !('value' in descriptor)) {
        throw new Error('Math.abs descriptor is required.');
      }

      let hostileCalls = 0;
      const mutateAuthority = () => {
        Object.defineProperty(Math, 'abs', {
          ...descriptor,
          value: () => {
            hostileCalls += 1;
            return 0;
          },
        });
      };

      let commandFailure: unknown;
      try {
        commandFailure = failureOf(() =>
          Fmt.Keyboard.command({
            get label() {
              mutateAuthority();
              return 'quit';
            },
            keys: ['q'],
          })
        );
      } finally {
        Object.defineProperty(Math, 'abs', descriptor);
      }

      let rowFailure: unknown;
      try {
        rowFailure = failureOf(() =>
          Fmt.Keyboard.row({
            get width() {
              mutateAuthority();
              return 0;
            },
            candidates: [],
          })
        );
      } finally {
        Object.defineProperty(Math, 'abs', descriptor);
      }

      expect(hostileCalls).to.eql(0);
      expect((commandFailure as Error).message).to.eql(
        'Cli.Fmt.Text presentation authority unavailable.',
      );
      expect(rowFailure).to.equal(commandFailure);
      expect(Cli.Fmt.Text.isReady()).to.eql(true);
    });

    it('bounds candidate traversal before reading indexed entries', () => {
      let entryReads = 0;
      const source = new Proxy([] as t.CliFormatKeyboard.Row.Candidate[], {
        get(_target, key) {
          if (key === 'length') return MAX_WIDTH_COLLECTION_LENGTH + 1;
          entryReads += 1;
          return { right: 'q' };
        },
      });

      expect(() => Fmt.Keyboard.row({ width: 80, candidates: source })).to.throw(
        'Cli.Fmt.Text finite presentation limit exceeded.',
      );
      expect(entryReads).to.eql(0);
    });

    it('fills and right-aligns right-only rows', () => {
      const right = 'quit: q';

      expect(Fmt.Keyboard.row({ width: 7, candidates: [{ right }] })).to.eql(right);
      expect(Fmt.Keyboard.row({ width: 8, candidates: [{ right }] })).to.eql(` ${right}`);
    });

    it('measures ANSI and wide Unicode candidates through the terminal-width formatter', () => {
      const row = Fmt.Keyboard.row({
        width: 5,
        candidates: [{ right: c.cyan('界  q') }],
      });

      expect(Cli.Fmt.Text.Width.measure(row ?? '')).to.eql(5);
      expect(Cli.stripAnsi(row ?? '')).to.eql('界  q');
    });

    it('retains the exact maximum width and propagates presentation-limit failures', () => {
      const row = Fmt.Keyboard.row({ width: 65_535, candidates: [{ right: 'q' }] });

      expect(Cli.Fmt.Text.Width.measure(row ?? '')).to.eql(65_535);
      expect(() =>
        Fmt.Keyboard.row({
          width: 65_535,
          candidates: [{ right: `${c.red('q')}` }],
        })
      ).to.throw('Cli.Fmt.Text finite presentation limit exceeded.');

      const zeroWidth = '\u200B'.repeat(32_768);
      expect(() =>
        Fmt.Keyboard.row({
          width: 2,
          candidates: [{ left: zeroWidth, right: zeroWidth }],
        })
      ).to.throw('Cli.Fmt.Text finite presentation limit exceeded.');
      expect(() =>
        Fmt.Keyboard.row({
          width: 65_535,
          candidates: [{ right: '界'.repeat(32_768) }],
        })
      ).to.throw('Cli.Fmt.Text finite presentation limit exceeded.');
    });

    it('omits empty and non-fitting candidate collections without clipping', () => {
      expect(Fmt.Keyboard.row({ width: 80, candidates: [] })).to.eql(undefined);
      expect(Fmt.Keyboard.row({ width: 6, candidates: [{ right: 'quit: q' }] })).to.eql(undefined);
    });
  });
});

function failureOf(operation: () => unknown): unknown {
  try {
    operation();
  } catch (cause) {
    return cause;
  }
}
