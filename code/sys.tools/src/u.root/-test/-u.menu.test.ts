import { c, Cli, describe, expect, it, Str } from '../../-test.ts';
import { menuMessage, optionLines, optionName } from '../u.menu.ts';

describe('Root Menu', () => {
  it('drops leading whitespace-only table rows', () => {
    const lines = optionLines([
      '                                                         ',
      '├─ @sys/tools pi             (← alias agent)             ',
      '└─ @sys/tools update         (← alias up, info)          ',
      '  (exit)                                                 ',
    ].join('\n'));

    expect(lines).to.eql([
      '├─ @sys/tools pi             (← alias agent)             ',
      '└─ @sys/tools update         (← alias up, info)          ',
      '  (exit)                                                 ',
    ]);
  });

  it('drops ansi-only rows when building visible options', () => {
    const lines = optionLines([
      c.gray('                                                         '),
      '├─ @sys/tools pi             (← alias agent)                 ',
    ].join('\n'));

    expect(lines).to.eql([
      '├─ @sys/tools pi             (← alias agent)                 ',
    ]);
  });

  it('falls back when a rendered line is visibly blank', () => {
    expect(optionName(c.gray('   '), 'fallback')).to.eql('fallback');
  });

  it('keeps more rows visibly non-empty', () => {
    const res = optionName(undefined, c.italic(c.gray('more...')));
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

  it('keeps more rows as a tree continuation, not a branch', () => {
    const lines = optionLines(
      Str.dedent([
        '├─ @sys/tools deploy',
        '│     more...',
        '└─ @sys/tools update',
        '  (exit)',
      ].join('\n')),
    );

    expect(lines[1]).to.eql('│     more...');
  });

  it('renders the root menu header without inline advisory detail', () => {
    const text = Cli.stripAnsi(menuMessage());
    expect(text).to.contain('system:tools@');
    expect(text).to.not.contain('Update available:');
  });
});
