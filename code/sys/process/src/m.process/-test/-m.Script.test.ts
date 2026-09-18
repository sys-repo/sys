import { describe, expect, it } from '../../-test.ts';
import { Process } from '../mod.ts';

describe('Process.Script', () => {
  const { Script } = Process;

  it('t: dedents a typical template literal and removes one blank edge per side', () => {
    const s = Script.t`
      one
        two
      three
    `;
    expect(s).to.eql('one\n  two\nthree');
  });

  it('t: preserves interior blank lines after removing the closing template edge', () => {
    const s = Script.t`
      one

      two

    `;
    expect(s).to.eql('one\n\ntwo\n');
  });

  it('t: normalizes CRLF and lone CR to LF', () => {
    // All non-blank lines have a common indent of two spaces.
    const raw = '\r\n  a\r\n  b\r  c\r\n';
    const s = Script.t([raw] as unknown as TemplateStringsArray);
    expect(s).to.eql(`a\nb\nc`);
  });

  it('t: handles tab indentation when computing common indent', () => {
    const s = Script.t`
\t\talpha
\t\t  beta
\t\tgamma
    `;
    expect(s).to.eql('alpha\n  beta\ngamma');
  });

  it('tight: removes ALL leading/trailing blank lines (beyond Str.dedent defaults)', () => {
    const s = Script.tight`


      x


    `;
    expect(s).to.eql(`x`);
  });

  it('tight: keeps interior blank lines', () => {
    const s = Script.tight`
      line-1

      line-2
    `;
    expect(s).to.eql(`line-1\n\nline-2`);
  });

  it('tight: works as a normal tag with interpolations', () => {
    const a = 'hello';
    const b = 42;
    const s = Script.tight`
      echo "${a}"
      echo ${b}
    `;
    expect(s).to.eql(`echo "hello"\necho 42`);
  });
});
