import { describe, Deps, Esm, expect, it } from './common.ts';

describe('Deps.toEntry', () => {
  it('from string', () => {
    const esm = 'jsr:@sys/tmp@0.1.2';
    const a = Deps.toEntry(esm);
    const b = Deps.toEntry(esm, { target: 'package.json' });
    const c = Deps.toEntry(esm, { target: ['package.json', 'deno.json'] });
    const d = Deps.toEntry(esm, { dev: true, subpaths: ['v2', 'http'] });

    expect(a.module.toString()).to.eql(esm);
    expect(b.module.input).to.eql(esm);
    expect(c.module.version).to.eql('0.1.2');

    expect(a.target).to.eql(['deno.json']);
    expect(b.target).to.eql(['package.json']);
    expect(c.target).to.eql(['deno.json', 'package.json']);

    expect([a.dev, a.subpaths]).to.eql([undefined, undefined]);
    expect([d.dev, d.subpaths]).to.eql([true, ['v2', 'http']]);
  });

  it('from {EsmImport}', () => {
    const esm = Esm.parse('jsr:@sys/tmp@0.1.2');
    const a = Deps.toEntry(esm);
    const b = Deps.toEntry(esm, { target: 'package.json', dev: true });
    const c = Deps.toEntry(esm, { subpaths: ['  '] });
    const d = Deps.toEntry(esm, { subpaths: ['', '//foo/bar//', ' v2 '] });

    expect(a.module.toString()).to.eql(esm.toString());
    expect(b.module.toString()).to.eql(esm.toString());
    expect(c.module.toString()).to.eql(esm.toString());

    expect([a.dev]).to.eql([undefined]);
    expect([b.dev]).to.eql([true]);
    expect([c.dev, c.subpaths]).to.eql([undefined, undefined]);
    expect(d.subpaths).to.eql(['foo/bar', 'v2']);
  });
});
