import { readInputs, selectPublication } from '../../src/m.deployment/mod.ts';
import { describe, expect, Fs, Hash, Is, it, ROOT } from './common.ts';

// Explicit build lane: attest the real sample product, not a synthetic projection fixture.
describe('R2 sample → inherited HTML integrity in written projections', () => {
  it('private HTML → public resource digests and content pins agree', async () => {
    const { buildRecord } = await readInputs(ROOT);
    const selected = await selectPublication(buildRecord.selection, ROOT);
    const preservedImage = 'images/wax-seal.v1.png';
    expect(selected.private).to.eql(['dist.json', preservedImage, 'index.html']);
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
    expect(images).to.include(preservedImage);
    const managedImage = images.find((path) => path !== preservedImage);
    if (!managedImage) throw new Error('Missing managed PNG.');
    const imageUrls = [...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"[^>]*>/g)].map(([, url]) => url);
    expect(imageUrls).to.eql([
      `${buildRecord.publicAssetBase}${managedImage}`,
      `${buildRecord.publicAssetBase}${preservedImage}`,
      `/ui/${preservedImage}`,
    ]);
    expect(html).not.to.include('vite-ignore');
    expect(html).not.to.include('%BASE_URL%');
    const imageLinks = [...html.matchAll(/<code>\s*<a\b([^>]*)>[^<]+<\/a>\s*<\/code>/g)];
    expect(imageLinks.map(([, attrs]) => /\shref="([^"]+)"/.exec(attrs)?.[1])).to.eql(
      [imageUrls[2]],
    );
    expect(html).to.include('<code>pkg/a.[hash].png</code>');
    expect(html).to.include(`<code>${preservedImage}</code>`);
    const captionLinks = [...html.matchAll(/<figcaption>([\s\S]*?)<\/figcaption>/g)]
      .flatMap(([, caption]) => [...caption.matchAll(/<a\b([^>]*)>/g)]);
    expect(captionLinks.length).to.eql(4);
    const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    expect(links.length).to.eql(6);
    for (const [, attrs, label] of links) {
      expect(attrs).to.match(/\starget="_blank"/);
      expect(attrs).to.match(/\srel="noopener noreferrer"/);
      expect(attrs).to.match(/\stitle="Opens in a new tab"/);
      expect(label.trim().endsWith(' ↗')).to.eql(true);
    }
    const source = (await Fs.read(Fs.join(ROOT, 'public/images/wax-seal.v1.png'))).data;
    if (!source) throw new Error('Missing source PNG.');
    for (const path of images) {
      expect((await Fs.read(Fs.join(ROOT, 'dist.public', path))).data).to.eql(source);
    }
    expect((await Fs.read(Fs.join(ROOT, 'dist.private', preservedImage))).data).to.eql(source);
    console.info('R2 image URLs:', imageUrls);
    console.info('R2 verified projections:', buildRecord);
  });
});
