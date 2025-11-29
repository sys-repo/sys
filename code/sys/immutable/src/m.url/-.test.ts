import { Url as Base } from '@sys/std';
import { describe, expect, it } from '../-test.ts';
import { Url } from './mod.ts';

describe(`Url`, () => {
  it('API', async () => {
    const m = await import('@sys/immutable/url');
    expect(m.Url).to.equal(Url);

    // Ensure all base Url fields are preserved by reference.
    const keys = Object.keys(Base) as (keyof typeof Base)[];
    for (const key of keys) {
      expect(Url[key]).to.equal(Base[key]);
    }
  });

  describe('Url.ref', () => {
    it('constructs from a URL instance', () => {
      const input = new URL('https://example.com/foo');
      const ref = Url.ref(input);

      expect(ref.current).to.be.instanceOf(URL);
      expect(ref.current.href).to.eql(input.href);
    });

    it('constructs from a { href } object', () => {
      const input = { href: 'https://example.com/bar?x=1' };
      const ref = Url.ref(input);

      expect(ref.current.href).to.eql(input.href);
    });

    it('constructs from a Std HttpUrl (toURL)', () => {
      const parsed = Base.parse('https://example.com/baz');
      expect(parsed.ok).to.eql(true);

      const ref = Url.ref(parsed);
      expect(ref.current.href).to.eql(parsed.toURL().href);
    });

    it('throws for non-UrlLike input', () => {
      const bad: unknown = 123;
      expect(() => Url.ref(bad as any)).to.throw('Url.ref: init must be UrlLike');
    });

    it('supports ImmutableRef semantics: change() + events()', () => {
      const ref = Url.ref(new URL('https://example.com/foo?x=1'));
      const beforeHref = ref.current.href;

      const events = ref.events();
      const seen: string[] = [];

      const sub = events.$.subscribe((e) => {
        expect(e.before).to.be.instanceOf(URL);
        expect(e.after).to.be.instanceOf(URL);
        seen.push(e.after.href);
      });

      ref.change((url) => {
        url.pathname = '/bar';
        url.searchParams.set('q', '1');
      });

      const afterHref = ref.current.href;

      expect(afterHref).to.eql('https://example.com/bar?x=1&q=1');
      expect(afterHref).to.not.eql(beforeHref);
      expect(ref.current.pathname).to.eql('/bar');
      expect(ref.current.searchParams.get('q')).to.eql('1');
      expect(seen).to.have.length(1);
      expect(seen[0]).to.eql(afterHref);

      sub.unsubscribe();
      events.dispose();
    });
  });
});
