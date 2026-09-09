import {
  type t,
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
} from '../../../-test.ts';
import { DevUrl } from './mod.ts';

describe('dev: url (DevUrlConfig DSL)', () => {
  DomMock.init({ beforeAll, afterAll });

  it('constructs from a URL and exposes a DevUrlConfig view', () => {
    const ref = DevUrl.ref('https://example.com/app');

    // Shape: DevUrlConfig view + URL-backed ref.
    expectTypeOf(ref.current).toEqualTypeOf<t.DevUrlConfig>();
    expectTypeOf(ref.url.current).toEqualTypeOf<URL>();

    // Initial state — no debug flag present.
    expect(ref.current.showDebug).to.eql(null);
    expect(ref.url.current.href).to.eql('https://example.com/app');
  });

  it('round-trips showDebug true/false via query parameters', () => {
    const ref = DevUrl.ref('https://example.com/app');

    // Turn on debug.
    ref.change((cfg) => {
      cfg.showDebug = true;
    });

    expect(ref.current.showDebug).to.eql(true);
    expect(ref.url.current.href).to.eql('https://example.com/app?debug=true');

    // Turn it back off.
    ref.change((cfg) => {
      cfg.showDebug = false;
    });

    expect(ref.current.showDebug).to.eql(false);
    expect(ref.url.current.href).to.eql('https://example.com/app?debug=false');
  });

  it('parses existing debug query parameter (truthy/falsy/weird)', () => {
    const refTrue = DevUrl.ref('https://example.com/app?debug=TRUE');
    expect(refTrue.current.showDebug).to.eql(true);

    const refFalse = DevUrl.ref('https://example.com/app?debug=0');
    expect(refFalse.current.showDebug).to.eql(false);

    const refWeird = DevUrl.ref('https://example.com/app?debug=wat');
    expect(refWeird.current.showDebug).to.eql(true);
  });

  it('removes debug query param when showDebug is reset to null', () => {
    const ref = DevUrl.ref('https://example.com/app?debug=true');

    expect(ref.current.showDebug).to.eql(true);

    ref.change((cfg) => {
      cfg.showDebug = null;
    });

    expect(ref.current.showDebug).to.eql(null);
    expect(ref.url.current.searchParams.has('debug')).to.eql(false);
  });
});
