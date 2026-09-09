import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Http, HttpClient, ServiceWorker } from '../../mod.ts';

describe('Http.ServiceWorker', () => {
  it('exports one frozen API through @sys/http/client', async () => {
    const m = await import('@sys/http/client');

    expect(m.ServiceWorker).to.equal(ServiceWorker);
    expect(m.Http.ServiceWorker).to.equal(ServiceWorker);
    expect(m.HttpClient.ServiceWorker).to.equal(ServiceWorker);
    expect(Http.ServiceWorker).to.equal(ServiceWorker);
    expect(HttpClient.ServiceWorker).to.equal(ServiceWorker);
    expect(Object.keys(ServiceWorker)).to.eql(['admit', 'register', 'tombstone']);
    expect(Object.isFrozen(Http)).to.eql(true);
    expect(Object.isFrozen(HttpClient)).to.eql(true);
    expect(Object.isFrozen(ServiceWorker)).to.eql(true);
    expect(Reflect.set(Http, 'ServiceWorker', {})).to.eql(false);
    expect(Http.ServiceWorker).to.equal(ServiceWorker);
  });

  it('exposes the canonical input contracts', () => {
    expectTypeOf(ServiceWorker).toMatchTypeOf<t.HttpServiceWorker.Lib>();
    expectTypeOf({} as t.HttpServiceWorker.Register.Args).toEqualTypeOf<{
      scriptUrl: string | t.UrlLike;
      options?: t.HttpServiceWorker.Register.Options;
    }>();
    expectTypeOf({} as t.HttpServiceWorker.Register.Options).toEqualTypeOf<{
      readonly scope?: string;
      readonly type?: 'classic' | 'module';
      readonly updateViaCache?: 'all' | 'imports' | 'none';
    }>();
    expectTypeOf({} as t.HttpServiceWorker.Tombstone.Args).toEqualTypeOf<{
      pkg: t.Pkg;
    }>();
  });
});
