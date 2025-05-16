import { describe, DomMock, expect, it, slug } from '../-test.ts';
import { LocalStorage } from './mod.ts';

describe('LocalStorage', { sanitizeOps: false, sanitizeResources: false }, () => {
  it('(setup)', () => DomMock.polyfill());

  type T = { count: number; msg?: string };
  const prefix = `test-${slug()}`;
  const store = LocalStorage.ns<T>(prefix);

  it('set/get', () => {
    const local = store.object({ count: 0 });
    expect(local.count).to.eql(0);
    expect(local.msg).to.eql(undefined);

    local.count = 456;
    local.msg = 'hello';

    expect(local.count).to.eql(456);
    expect(local.msg).to.eql('hello');
  });
});
