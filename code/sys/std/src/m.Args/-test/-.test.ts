import { describe, expect, it } from '../../-test.ts';
import { Args, parseArgs } from '../mod.ts';

describe('Args', () => {
  it('API', async () => {
    const m = await import('@sys/std/args');
    expect(m.Args).to.equal(Args);
    expect(m.parseArgs).to.equal(parseArgs);
  });

  describe('Args.toAliasLookup', () => {
    it('builds alias → canonical lookup', () => {
      const map = { copy: ['cp'], update: ['up'] } as const;
      const lookup = Args.toAliasLookup(map);
      expect(lookup).to.eql({ cp: 'copy', up: 'update' });
    });

    it('typed: preserves canonical command union', () => {
      const map = { copy: ['cp'], update: ['up'] } as const;
      const lookup = Args.toAliasLookup(map);

      const a: 'copy' | 'update' = lookup.cp;
      const b: 'copy' | 'update' = lookup.up;
      expect(a).to.equal('copy');
      expect(b).to.equal('update');

      // This does NOT error at the type level:
      const _bad = lookup.zz;
    });

    it('works in reduce without casts (canonical use)', () => {
      type T = Record<string, keyof typeof map>;
      const map = { copy: ['cp'], update: ['up'] } as const;

      const lookup = Args.toAliasLookup(map);
      const res = Object.entries(lookup).reduce((acc, [alias, cmd]) => {
        acc[alias] = cmd;
        return acc;
      }, {} as T);

      expect(res).to.eql({ cp: 'copy', up: 'update' });
    });
  });

  describe('Args.normalizeCommand', () => {
    it('empty argv', () => {
      const lookup = { cp: 'copy' } as const;
      const res = Args.normalizeCommand([], lookup);
      expect(res).to.eql([]);
    });

    it('no match (returns new array)', () => {
      const lookup = { cp: 'copy' } as const;
      const argv = ['copy', '--x'];
      const res = Args.normalizeCommand(argv, lookup);

      expect(res).to.eql(['copy', '--x']);
      expect(res).to.not.equal(argv); // new array, stable semantics
    });

    it('match rewrites head only', () => {
      const lookup = { cp: 'copy', up: 'update' } as const;
      const res = Args.normalizeCommand(['cp', '--flag', 'x'], lookup);
      expect(res).to.eql(['copy', '--flag', 'x']);
    });

    it('typed: canonical command is preserved', () => {
      const lookup = { cp: 'copy', up: 'update' } as const;
      const argv = Args.normalizeCommand(['cp'], lookup);
      const head = argv[0];
      expect(head).to.equal('copy');
    });
  });
});
