import { readInputs, selectPublication } from '../../src/m.deployment/mod.ts';
import { describe, expect, Fs, Hash, Is, it, ROOT } from './common.ts';

// Explicit build lane: attest the real sample product, not a synthetic projection fixture.
describe('R2 sample → inherited HTML integrity in written projections', () => {
  it('private HTML → public resource digests and content pins agree', async () => {
    const { buildRecord } = await readInputs(ROOT);
    const selected = await selectPublication(buildRecord.selection, ROOT);
    expect(selected.private).to.eql(['dist.json', 'index.html']);
    const html = (await Fs.readText(Fs.join(ROOT, 'dist.private/index.html'))).data;
    if (!Is.str(html)) throw new Error('Missing written sample HTML.');
    expect((await Fs.readText(Fs.join(ROOT, 'dist/index.html'))).data).to.eql(html);

    // Enumerate references independently of integrity presence; the controlled output is quoted.
    const tags = [...html.matchAll(/<(?:script|link)\b[^>]*>/g)].map(([tag]) => tag).filter((tag) =>
      /\stype="module"|\srel="(?:stylesheet|modulepreload)"/.test(tag)
    );
    expect(tags.length).to.eql(2);
    for (const tag of tags) {
      const url = /\s(?:src|href)="([^"]+)"/.exec(tag)?.[1];
      if (!url) throw new Error(`Missing covered resource URL: ${tag}`);
      expect(url.startsWith(buildRecord.publicAssetBase)).to.eql(true);
      const path = url.slice(buildRecord.publicAssetBase.length);
      expect(selected.public).to.include(path);
      const bytes = (await Fs.read(Fs.join(ROOT, 'dist.public', path))).data;
      if (!bytes) throw new Error(`Missing written public resource: ${path}`);
      const digest = Hash.sha256(bytes, { encoding: 'base64' });
      expect(/\sintegrity="([^"]*)"/.exec(tag)?.[1]).to.eql(digest);
      expect(tag).to.match(/\scrossorigin(?:="(?:anonymous)?")?(?=[\s>])/);
      console.info('R2 written-byte SRI:', { path, digest });
    }

    const images = selected.public.filter((path) => path.endsWith('.png'));
    expect(images.length).to.eql(2);
    expect(images).to.include('images/wax-seal.v1.png');
    const source = (await Fs.read(Fs.join(ROOT, 'public/images/wax-seal.v1.png'))).data;
    if (!source) throw new Error('Missing source PNG.');
    for (const path of images) {
      expect((await Fs.read(Fs.join(ROOT, 'dist.public', path))).data).to.eql(source);
    }
    console.info('R2 verified projections:', buildRecord);
  });
});
