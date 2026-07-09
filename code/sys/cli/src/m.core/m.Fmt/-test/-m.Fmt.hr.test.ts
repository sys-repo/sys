import { describe, expect, it } from '../../../-test.ts';
import { c, Cli, Fmt } from '../../mod.ts';

describe('Cli.Fmt.hr', () => {
  describe('line mode', () => {
    it('uses measured terminal width by default', () => {
      const restore = stubScreenWidth(12);
      try {
        expect(Fmt.hr()).to.eql('━'.repeat(12));
      } finally {
        restore();
      }
    });

    it('keeps existing shorthand and options call forms stable', () => {
      expect(Fmt.hr(6)).to.eql('━'.repeat(6));
      expect(Fmt.hr(6, 'cyan')).to.eql(c.cyan('━'.repeat(6)));
      expect(Fmt.hr({ width: 5, color: 'magenta' })).to.eql(c.magenta('━'.repeat(5)));

      const restore = stubScreenWidth(9);
      try {
        expect(Fmt.hr('green')).to.eql(c.green('━'.repeat(9)));
        expect(Fmt.hr({ color: 'yellow' })).to.eql(c.yellow('━'.repeat(9)));
      } finally {
        restore();
      }
    });

    it('renders each rule weight', () => {
      expect(Fmt.hr({ width: 5, weight: 'heavy' })).to.eql('━'.repeat(5));
      expect(Fmt.hr({ width: 5, weight: 'light' })).to.eql('─'.repeat(5));
      expect(Fmt.hr({ width: 5, weight: 'double' })).to.eql('═'.repeat(5));
      expect(Fmt.hr({ width: 5, weight: 'dashed' })).to.eql('┄'.repeat(5));
      expect(Fmt.hr({ width: 5, color: 'gray', weight: 'light' })).to.eql(c.gray('─'.repeat(5)));
    });
  });

  describe('progress mode', () => {
    describe('geometry', () => {
      it('splits shorthand percent into indicator and track cells', () => {
        expect(Fmt.hr({ width: 10, progress: 0.35 })).to.eql(
          c.green('━'.repeat(3)) + c.gray('━'.repeat(7)),
        );
      });

      it('renders zero and full completion boundaries', () => {
        expect(Fmt.hr({ width: 4, progress: { percent: 0 } })).to.eql(c.gray('━'.repeat(4)));
        expect(Fmt.hr({ width: 4, progress: { percent: 1 } })).to.eql(c.green('━'.repeat(4)));
      });

      it('uses measured terminal width when width is omitted', () => {
        const restore = stubScreenWidth(10);
        try {
          expect(Fmt.hr({ progress: 0.5 })).to.eql(
            c.green('━'.repeat(5)) + c.gray('━'.repeat(5)),
          );
        } finally {
          restore();
        }
      });

      it('uses the selected weight for both indicator and track', () => {
        expect(Fmt.hr({ width: 6, weight: 'light', progress: 0.5 })).to.eql(
          c.green('─'.repeat(3)) + c.gray('─'.repeat(3)),
        );
      });

      it('normalizes invalid percentages without losing the track', () => {
        expect(Fmt.hr({ width: 4, progress: -1 })).to.eql(c.gray('━'.repeat(4)));
        expect(Fmt.hr({ width: 4, progress: 2 })).to.eql(c.green('━'.repeat(4)));
        expect(Fmt.hr({ width: 4, progress: Number.NaN })).to.eql(c.gray('━'.repeat(4)));
        expect(Fmt.hr({ width: 4, progress: { percent: Number.NaN } })).to.eql(
          c.gray('━'.repeat(4)),
        );
      });
    });

    describe('color', () => {
      it('maps the root color to the indicator', () => {
        expect(Fmt.hr({ width: 10, color: 'yellow', progress: 0.2 })).to.eql(
          c.yellow('━'.repeat(2)) + c.gray('━'.repeat(8)),
        );
      });

      it('uses progress part colors as local overrides', () => {
        expect(
          Fmt.hr({
            width: 10,
            color: 'yellow',
            progress: {
              percent: 0.4,
              color: { indicator: 'cyan', track: 'magenta' },
            },
          }),
        ).to.eql(c.cyan('━'.repeat(4)) + c.magenta('━'.repeat(6)));
      });
    });
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
