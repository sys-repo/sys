import { describe, expect, it, Cli } from '../../-test.ts';
import { optionLines, optionName } from '../u.menu.ts';

describe('Root Menu', () => {
  it('drops leading whitespace-only table rows', () => {
    const lines = optionLines([
      '                                               ',
      '├─ @sys/tools ƒn             (← alias agent)   ',
      '└─ @sys/tools update         (← alias up, info)',
      '  (exit)                                       ',
    ].join('\n'));

    expect(lines).to.eql([
      '├─ @sys/tools ƒn             (← alias agent)   ',
      '└─ @sys/tools update         (← alias up, info)',
      '  (exit)                                       ',
    ]);
  });

  it('drops ansi-only rows when building visible options', () => {
    const lines = optionLines([
      '\x1b[90m                                               \x1b[39m',
      '├─ @sys/tools ƒ             (← aliases fn, agent)   ',
    ].join('\n'));

    expect(lines).to.eql([
      '├─ @sys/tools ƒ             (← aliases fn, agent)   ',
    ]);
  });

  it('falls back when a rendered line is visibly blank', () => {
    expect(optionName('\x1b[90m   \x1b[39m', 'fallback')).to.eql('fallback');
  });

  it('keeps more rows visibly non-empty', () => {
    const res = optionName(undefined, '\x1b[3m\x1b[90mmore...\x1b[39m\x1b[23m');
    expect(Cli.stripAnsi(res).trim()).to.eql('more...');
  });

  it('preserves the last tree branch before standalone back rows', () => {
    const lines = optionLines([
      '├─ @sys/tools crdt                       ',
      '├─ @sys/tools video                      ',
      '├─ @sys/tools cryptography               ',
      '└─ @sys/tools clipboard      (← alias cp)',
      ' ← back                                 ',
      '  (exit)                                ',
    ].join('\n'));

    expect(lines[3]).to.eql('└─ @sys/tools clipboard      (← alias cp)');
    expect(lines[4]).to.eql(' ← back                                 ');
  });
});
