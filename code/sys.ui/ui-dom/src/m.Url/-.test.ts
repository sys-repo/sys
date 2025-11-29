import { Url as UrlBaseBase } from '@sys/std/url';
import { Url as UrlBase } from '@sys/immutable/url';
import { describe, expect, expectTypeOf, it } from '../-test.ts';
import { Url } from './mod.ts';

describe(`Url`, () => {
  it('API', async () => {
    const m = await import('@sys/ui-dom/url');
    expect(m.Url).to.equal(Url);

    // Ensure all base Url fields are preserved by reference.
    const keysA = Object.keys(UrlBase) as (keyof typeof UrlBaseBase)[];
    const keysB = Object.keys(UrlBase) as (keyof typeof UrlBase)[];
    keysA.forEach((key) => expect(Url[key]).to.equal(UrlBase[key]));
    keysB.forEach((key) => expect(Url[key]).to.equal(UrlBase[key]));
  });
});
