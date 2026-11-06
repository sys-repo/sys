import { describe, DevArgs, expect, it } from './common.ts';
import { Specs, specsFor } from '../../../../src/-test/-specs.ts';
import { SpecLinks, SpecNames } from '../../-u.navigation.ts';

const base = 'https://example.test/ui/';
const route = (key: string, value: string) => `${base}?${new URLSearchParams({ [key]: value })}`;

describe('passkey specimen navigation', () => {
  it('index and unknown routes → only the listed specs', () => {
    expect(Object.keys(Specs)).to.contain(SpecNames.sample);
    expect(Object.keys(Specs)).not.to.contain(SpecNames.view);
    const indexRoutes = [
      base,
      `${base}?dev`,
      `${base}?dev=true`,
      `${base}?d`,
      route('dev', 'missing'),
    ];
    for (const href of indexRoutes) {
      expect(specsFor(href)).to.equal(Specs);
    }
    expect(specsFor(route('dev', SpecNames.sample))).to.equal(Specs);
    expect(specsFor(route('d', DevArgs.Url.moduleId(SpecNames.sample)))).to.equal(Specs);
  });

  it('secondary namespace and generated ID → addressable through either dev flag', () => {
    for (const key of ['dev', 'd']) {
      for (const name of [SpecNames.view, DevArgs.Url.moduleId(SpecNames.view)]) {
        const href = route(key, name);
        const imports = specsFor(href);
        expect(imports[SpecNames.sample]).to.equal(Specs[SpecNames.sample]);
        const url = DevArgs.Url.navigate.formatDevFlag({ location: href });
        const matches = DevArgs.Url.moduleMatches(url.searchParams.get('dev') ?? '', imports);
        expect(matches.map((match) => match.namespace)).to.eql([SpecNames.view]);
        expect(specsFor(href)[SpecNames.view]).to.equal(imports[SpecNames.view]);
      }
    }
  });

  it('both flags → preserve the shared harness alias precedence without mutating the input', () => {
    const url = new URL(route('dev', SpecNames.sample));
    url.searchParams.set('d', SpecNames.view);
    const before = url.href;
    expect(Object.keys(specsFor(url))).to.contain(SpecNames.view);
    expect(url.href).to.eql(before);
    url.searchParams.set('d', '');
    expect(specsFor(url)).to.equal(Specs);
  });

  it('reciprocal links → same host/path, canonical destination, no stale alias', () => {
    for (const to of ['view', 'sample'] as const) {
      const url = new URL(SpecLinks[to].href, route('d', SpecNames.sample));
      expect(url.origin + url.pathname).to.eql(base);
      expect(url.searchParams.has('d')).to.eql(false);
      const matches = DevArgs.Url.moduleMatches(url.searchParams.get('dev') ?? '', specsFor(url));
      expect(matches.map((match) => match.namespace)).to.eql([SpecNames[to]]);
    }
  });
});
