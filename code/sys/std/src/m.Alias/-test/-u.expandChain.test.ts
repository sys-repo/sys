import { type t, c, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { AliasResolver } from '../mod.ts';

const expandChain = AliasResolver.expandChain;

describe('AliasResolver.expandChain', () => {
  it('print sample', async () => {
    const localAlias = {
      /**
       * NOTE: AliasResolver treats this exactly the same as any other alias key.
       * It has *zero* built-in semantic meaning.
       *
       * We (the call-site) choose to *interpret* ":index" as
       * "the CRDT document whose alias table we should jump into next".
       *
       * That interpretation lives ONLY in loadNext — not in the resolver.
       */
      ':index': 'crdt:21JvXzARPYFXDVMag3x4UhLgHcQi',

      /**
       * Pure symbolic wiring. No CRDT, no file paths, no magic.
       * AliasResolver only sees a flat token→string map.
       */
      ':p2p-assets': ':assets/p2p-5.0-strategy-2025',
      ':p2p-videos': ':p2p-assets/videos',
    };

    /**
     * The alias table we hop into only *if* loadNext decides it applies.
     * Again: no special semantics here, just another alias map.
     */
    const indexAlias = {
      ':assets': '/Users/username/Documents/Video/P2P-program/v2/publish/',
    };

    const resolver: t.Alias.Resolver = {
      root: localAlias,
      alias: localAlias,
    };

    const raw = '/:p2p-videos/p2p 5.8 conclusion.webm.02.mp4.webm';

    const result = await expandChain(raw, resolver, {
      async loadNext({ step }) {
        /**
         * Call-site semantic decision:
         *
         *    "If unresolved tokens include :assets, then we
         *    know that the next table we want is indexAlias."
         *
         * This is where :index / :assets gain meaning — and only here.
         * The pure AliasResolver remains completely ignorant of this logic.
         */
        if (step.remaining.includes(':assets')) {
          return { root: indexAlias, alias: indexAlias };
        }
        return null;
      },
    });

    // Tiny sanity check so the test is not "print only".
    expect(result.value).to.include('p2p 5.8 conclusion.webm.02.mp4.webm');

    console.info();
    console.info(c.cyan('AliasResolver.expandChain:'));
    console.info(c.gray(`raw: ${c.italic(raw)}\n`));
    console.info(c.magenta('localAlias:'), localAlias);
    console.info(c.magenta('indexAlias:'), indexAlias);
    console.info();
    console.info(c.cyan('result:'), result);
    console.info();
  });

  it('behaves like single-table expand when no loadNext is provided', async () => {
    const table = {
      ':core': '/slug/data/prog.core',
    };

    const { resolver } = AliasResolver.analyze(table);
    const res = await expandChain('/root/:core/file.yaml', resolver);

    // Single hop, same semantics as `expand` with the table.
    expect(res.value).to.eql('/root//slug/data/prog.core/file.yaml');
    expect(res.steps.length).to.eql(1);

    const [step] = res.steps;
    expect(step.alias).to.eql(resolver.alias);
    expect(step.used).to.eql([':core']);
    expect(step.remaining).to.eql([]);

    // No unresolved tokens at the end.
    expect(res.remaining).to.eql([]);
  });

  it('chains to a second resolver when loadNext returns a resolver', async () => {
    const table1 = {
      ':index': 'crdt:123',
      ':core-slugs': '/:index/alias/:core',
    };

    const table2 = {
      ':core': '/slug/data/prog.core',
    };

    const { resolver: resolver1 } = AliasResolver.analyze(table1);
    const { resolver: resolver2 } = AliasResolver.analyze(table2);

    const res = await expandChain('/:core-slugs/3.1-foo', resolver1, {
      async loadNext(e) {
        // After first hop we expect ":core" to still be present.
        if (e.step.remaining.includes(':core')) return resolver2;
        return null;
      },
    });

    expect(res.steps.length).to.eql(2);

    const [first, second] = res.steps;

    // First hop only knows about index + core-slugs.
    expect(first.used).to.include.members([':core-slugs', ':index']);
    expect(first.remaining).to.include(':core');

    // Second hop resolves ":core".
    expect(second.used).to.include(':core');
    expect(second.remaining).to.eql([]);

    // Final string matches the two-stage expansion.
    expect(res.value).to.eql('//crdt:123/alias//slug/data/prog.core/3.1-foo');
    expect(res.remaining).to.eql([]);
  });

  it('chains to a second table when loadNext returns a bare map', async () => {
    const table1 = {
      ':p2p-videos': ':p2p-assets/videos',
      ':p2p-assets': ':assets/p2p-5.0-strategy-2025',
    };

    const table2 = {
      ':assets': '/fs/root/assets',
    };

    const { resolver: resolver1 } = AliasResolver.analyze(table1);

    const res = await expandChain('/:p2p-videos/file.webm', resolver1, {
      async loadNext(e) {
        // When ":assets" is still unresolved, supply a raw map.
        if (e.step.remaining.includes(':assets')) return table2;
        return null;
      },
    });

    expect(res.steps.length).to.eql(2);

    const [first, second] = res.steps;

    expect(first.used).to.include.members([':p2p-videos', ':p2p-assets']);
    expect(first.remaining).to.eql([':assets']);

    expect(second.used).to.include(':assets');
    expect(second.remaining).to.eql([]);

    // "/:p2p-videos/file.webm"
    //   → "/:p2p-assets/videos/file.webm"
    //   → "/:assets/p2p-5.0-strategy-2025/videos/file.webm"
    //   → "//fs/root/assets/p2p-5.0-strategy-2025/videos/file.webm"
    expect(res.value).to.eql('//fs/root/assets/p2p-5.0-strategy-2025/videos/file.webm');
    expect(res.remaining).to.eql([]);
  });

  it('stops early when loadNext returns null and preserves remaining tokens', async () => {
    const table1 = {
      ':a': '/:b',
    };

    const { resolver } = AliasResolver.analyze(table1);

    const res = await expandChain('/:a/path', resolver, {
      async loadNext() {
        // Decline to continue the chain.
        return null;
      },
    });

    expect(res.steps.length).to.eql(1);

    const [step] = res.steps;

    // One hop: "/:a/path" → "//:b/path"
    expect(step.value).to.eql('//:b/path');
    expect(step.used).to.eql([':a']);
    expect(step.remaining).to.eql([':b']);

    // Final remaining matches the last step.
    expect(res.value).to.eql('//:b/path');
    expect(res.remaining).to.eql([':b']);
  });

  it('honors maxDepth for number of tables/hops', async () => {
    const table = {
      ':a': '/:b',
      ':b': '/:a',
    };

    const { resolver } = AliasResolver.analyze(table);

    const res = await expandChain('/:a/path', resolver, {
      maxDepth: 1,
      async loadNext(e) {
        // Always try to reuse the same resolver to simulate a chain
        // that *could* keep going if maxDepth allowed.
        return e.resolver;
      },
    });

    // Only one hop recorded at the chain level.
    expect(res.steps.length).to.eql(1);

    const [step] = res.steps;

    // The step must have done some work and left unresolved tokens.
    expect(step.used.length).to.be.greaterThan(0);
    expect(step.remaining.length).to.be.greaterThan(0);

    // Final remaining tokens mirror the last step.
    expect(res.remaining).to.eql(step.remaining);
  });

  it('returns steps with the expected type shape', async () => {
    const table = { ':core': '/slug/data/prog.core' };
    const { resolver } = AliasResolver.analyze(table);

    const res = await expandChain('/:core', resolver);
    expectTypeOf(res.steps).toEqualTypeOf<readonly t.Alias.ExpandChainStep[]>();
  });
});
