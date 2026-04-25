import { describe, expect, it } from '../../../-test.ts';
import { c, Cli, Fmt } from '../../mod.ts';

describe('Cli.Fmt.hr', () => {
  it('returns a plain rule using screen width by default', () => {
    const restore = stubScreenWidth(12);
    try {
      expect(Fmt.hr()).to.eql('━'.repeat(12));
    } finally {
      restore();
    }
  });

  it('accepts width only', () => {
    expect(Fmt.hr(6)).to.eql('━'.repeat(6));
  });

  it('accepts color only', () => {
    const restore = stubScreenWidth(9);
    try {
      expect(Fmt.hr('green')).to.eql(c.green('━'.repeat(9)));
    } finally {
      restore();
    }
  });

  it('accepts width and color', () => {
    expect(Fmt.hr(6, 'cyan')).to.eql(c.cyan('━'.repeat(6)));
  });

  it('accepts options using measured width when width is omitted', () => {
    const restore = stubScreenWidth(7);
    try {
      expect(Fmt.hr({ color: 'yellow' })).to.eql(c.yellow('━'.repeat(7)));
    } finally {
      restore();
    }
  });

  it('accepts options with width and color', () => {
    expect(Fmt.hr({ width: 5, color: 'magenta' })).to.eql(c.magenta('━'.repeat(5)));
  });
});

function stubScreenWidth(width: number): () => void {
  const screen = Cli.Screen as { size: () => { width: number; height: number } };
  const prev = screen.size;
  screen.size = () => ({ width, height: 24 });
  return () => {
    screen.size = prev;
  };
}
