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
      if (debug === true) return void searchParams.set('d', ''); // Short-flag form.

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
      const dev = makeDsl();
      const config = read(dev.current);
      const base = UrlBase.parse(init).toURL();

      expect(config).to.eql({ path: '/foo', debug: false });
      expect(dev.current.origin).to.eql(base.origin);
    });

    it('applies config changes back onto the URL', () => {
      const dev = makeDsl();

      dev.change((draft) => {
        draft.path = '/bar';
        draft.debug = true;
      });

      const config = read(dev.current);
      expect(config).to.eql({ path: '/bar', debug: true });
      expect(dev.current.pathname).to.eql('/bar');
      expect(dev.current.searchParams.has('d')).to.eql(true);
      expect(dev.current.searchParams.get('debug')).to.eql(null);
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
      const dev = makeDsl();
      const config = read(dev.current);
      expect(config).to.eql({ path: '/foo', debug: true });
    });

    it('writes debug string as ?debug=<label>', () => {
      const dev = makeDsl();

      dev.change((draft) => {
        draft.path = '/bar';
        draft.debug = 'foobar';
      });

      const url = dev.current;
      expect(url.pathname).to.eql('/bar');
      expect(url.searchParams.get('debug')).to.eql('foobar');
      expect(url.searchParams.has('d')).to.eql(false);
    });
  });
});
