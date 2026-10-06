import { afterEach, beforeEach } from '@sys/testing/server';
import { DomMock, TestReact } from '@sys/ui-react/testing/server';
import { readInputs, selectPublication } from '../../src/m.deployment/mod.ts';
import { React } from '../../src/ui/common.ts';
import { Page } from '../../src/ui/m.Page/mod.ts';
import { describe, expect, Fs, Hash, Is, it, ROOT } from './common.ts';

// Explicit build lane: attest the real sample product, not a synthetic projection fixture.
describe('R2 sample → inherited HTML integrity in written projections', () => {
  DomMock.init({ beforeEach, afterEach });

  it('private HTML → public resource digests and content pins agree', async () => {
    const { buildRecord } = await readInputs(ROOT);
    const selected = await selectPublication(buildRecord.selection, ROOT);
    const preservedImage = 'images/wax-seal.png';
    expect(selected.private).to.eql(['dist.json', preservedImage, 'index.html']);
    const html = (await Fs.readText(Fs.join(ROOT, 'dist.private/index.html'))).data;
    if (!Is.str(html)) throw new Error('Missing written sample HTML.');
    expect((await Fs.readText(Fs.join(ROOT, 'dist/index.html'))).data).to.eql(html);
    const body = /<body>([\s\S]*?)<\/body>/.exec(html)?.[1];
    if (!Is.str(body)) throw new Error('Missing written sample body.');
    const template = document.createElement('template');
    template.innerHTML = body;
    expect([...template.content.children].map((el) => el.tagName)).to.eql(['DIV']);
    expect(template.content.querySelector('#root')?.innerHTML).to.eql('');
    expect(template.content.textContent?.trim()).to.eql('');
    expect(html).not.to.include('vite-ignore');
    expect(html).not.to.include('%BASE_URL%');

    // Enumerate references independently of integrity presence; the controlled output is quoted.
    const tags = [...html.matchAll(/<(?:script|link)\b[^>]*>/g)].map(([tag]) => tag).filter((tag) =>
      /\stype="module"|\srel="(?:stylesheet|modulepreload)"/.test(tag)
    );
    expect(tags.some((tag) => /^<script\b[^>]*\stype="module"/.test(tag))).to.eql(true);
    expect(tags.some((tag) => /^<link\b[^>]*\srel="stylesheet"/.test(tag))).to.eql(true);
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
    const managedImageUrl = `${buildRecord.publicAssetBase}${managedImage}`;
    const modules = await Promise.all(
      selected.public.filter((path) => path.endsWith('.js')).map(async (path) => {
        const text = (await Fs.readText(Fs.join(ROOT, 'dist.public', path))).data;
        if (!Is.str(text)) throw new Error(`Missing written public module: ${path}`);
        return text;
      }),
    );
    expect(modules.some((text) => text.includes(managedImageUrl))).to.eql(true);

    // Compose with the emitted URL; this is not browser-bundle execution or SSR output.
    const rendered = await TestReact.render(
      React.createElement(Page, {
        origin: '',
        publicAssetBase: buildRecord.publicAssetBase,
        managedImageUrl,
      }),
      { strict: false },
    );
    try {
      const imageUrls = [...rendered.container.querySelectorAll('img')].map((image) =>
        image.getAttribute('src')
      );
      expect(imageUrls).to.eql([
        managedImageUrl,
        `${buildRecord.publicAssetBase}${preservedImage}`,
        `/ui/${preservedImage}`,
      ]);
      console.info('R2 composed image URLs:', imageUrls);
    } finally {
      rendered.dispose();
    }
    const source = (await Fs.read(Fs.join(ROOT, 'public/images/wax-seal.png'))).data;
    if (!source) throw new Error('Missing source PNG.');
    for (const path of images) {
      expect((await Fs.read(Fs.join(ROOT, 'dist.public', path))).data).to.eql(source);
    }
    expect((await Fs.read(Fs.join(ROOT, 'dist.private', preservedImage))).data).to.eql(source);
    console.info('R2 verified projections:', buildRecord);
  });
});
