import { type t, describe, expect, it } from '../../-test.ts';
import { Url } from '../mod.ts';
import { UrlBase } from '../common.ts';

describe('Url.dsl', () => {
  type SampleConfig = {
    path: string;
    debug: boolean | string;
  };

  /**
   * Define DSL:
   *
   * Maps URL <-> SampleConfig:
   * - debug=false  → { debug: false }
   * - debug=true   → { debug: true }
   * - debug=<str>  → { debug: <str> }
   * - ?d           → { debug: true }
   * - (none)       → { debug: false }
   */
  const read = (url: URL): SampleConfig => {
    const { searchParams } = url;
    const explicit = searchParams.get('debug');

    if (explicit !== null) {
      if (explicit === 'true') return { path: url.pathname, debug: true };
      if (explicit === 'false') return { path: url.pathname, debug: false };
      return { path: url.pathname, debug: explicit };
    }

    if (searchParams.has('d')) return { path: url.pathname, debug: true };

    return { path: url.pathname, debug: false };
  };

  const write = (urlRef: t.UrlRef, config: SampleConfig) => {
    urlRef.change((url) => {
      url.pathname = config.path;
      const { searchParams } = url;

      // Reset both encodings before applying the new state.
      searchParams.delete('d');
      searchParams.delete('debug');

      const { debug } = config;
      if (debug === false) return;

      if (debug === true) {
        // Short-flag form.
        searchParams.set('d', '');
        return;
      }

      // String label form.
      searchParams.set('debug', String(debug));
    });
  };

  /**
   * Baseline example: projects a simple {path, debug} config view from a URL
   * and round-trips boolean debug state through the shared read/write mapping.
   */
  describe('example: simple config DSL', () => {
    const init = 'https://example.com/foo?debug=false';
    const makeDsl = () => Url.dsl(init, read, write);

    it('projects a config view from a URL', () => {
      const dsl = makeDsl();
      const base = UrlBase.parse(init).toURL();

      // `current` is the projected SampleConfig.
      expect(dsl.current).to.eql({ path: '/foo', debug: false });

      // Underlying URL is accessible via `url.current`.
      expect(dsl.url.current.origin).to.eql(base.origin);
      expect(dsl.url.current.pathname).to.eql('/foo');
    });

    it('applies config changes back onto the URL', () => {
      const dsl = makeDsl();

      dsl.change((draft) => {
        draft.path = '/bar';
        draft.debug = true;
      });

      // Config view updated.
      expect(dsl.current).to.eql({ path: '/bar', debug: true });

      // Underlying URL updated via the write mapping.
      const url = dsl.url.current;
      expect(url.pathname).to.eql('/bar');
      expect(url.searchParams.has('d')).to.eql(true);
      expect(url.searchParams.get('debug')).to.eql(null);
    });
  });

  /**
   * Demonstrates alternate encodings: ?d as a boolean debug flag and
   * ?debug=<label> as a string, both mapped through the same config view.
   */
  describe('example: debug flag/label DSL', () => {
    const init = 'https://example.com/foo?d';
    const makeDsl = () => Url.dsl(init, read, write);

    it('reads short flag ?d as debug = true', () => {
      const dsl = makeDsl();
      expect(dsl.current).to.eql({ path: '/foo', debug: true });
      expect(dsl.url.current.searchParams.has('d')).to.eql(true);
      expect(dsl.url.current.searchParams.get('debug')).to.eql(null);
    });

    it('writes debug string as ?debug=<label>', () => {
      const dsl = makeDsl();

      dsl.change((draft) => {
        draft.path = '/bar';
        draft.debug = 'foobar';
      });

      const url = dsl.url.current;
      expect(url.pathname).to.eql('/bar');
      expect(url.searchParams.get('debug')).to.eql('foobar');
      expect(url.searchParams.has('d')).to.eql(false);

      // Config view and URL encoding stay in sync.
      expect(dsl.current).to.eql({ path: '/bar', debug: 'foobar' });
    });
  });

  /**
   * Ensures the DSL still exposes URL-level change events via `dsl.url.events()`,
   * even though config changes go through the single `change` surface.
   */
  describe('events: url change stream', () => {
    const init = 'https://example.com/foo?debug=false';
    const makeDsl = () => Url.dsl(init, read, write);

    it('emits URL change events when the DSL updates config', () => {
      const dsl = makeDsl();
      const ev = dsl.url.events();

      const seen: t.ImmutableChangeReadonly<URL, t.UrlPatch>[] = [];
      ev.$.subscribe((e) => seen.push(e));

      dsl.change((draft) => {
        draft.path = '/events';
        draft.debug = true;
      });

      expect(seen.length).to.be.greaterThan(0);

      const last = seen[seen.length - 1];
      expect(last.after.pathname).to.eql('/events');
      expect(last.after.searchParams.has('d')).to.eql(true);
      expect(last.after.searchParams.get('debug')).to.eql(null);
      expect(last.before.href).to.not.eql(last.after.href);
    });
  });
});
