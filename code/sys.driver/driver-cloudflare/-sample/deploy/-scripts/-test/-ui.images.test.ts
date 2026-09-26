import { DomMock } from '@sys/std/testing/server/dom';
import { afterEach, beforeEach } from '@sys/testing/server';
import { describe, expect, Fs, it, ROOT } from './common.ts';

describe('R2 deployment sample: native image examples', () => {
  DomMock.init({ beforeEach, afterEach });

  it('same artwork → two named build paths outside the application root', async () => {
    const source = await Fs.readText(Fs.join(ROOT, 'src/ui/index.html'));
    if (!source.ok || source.data === undefined) throw new Error('Sample HTML must be readable.');
    // Parse inertly: these source-contract assertions must not execute scripts or fetch assets.
    const template = document.createElement('template');
    template.innerHTML = source.data;
    const root = template.content.querySelector('#root');
    const footer = template.content.querySelector('footer');
    if (!root || !footer) throw new Error('Sample root and footer must exist.');
    expect(root.nextElementSibling).to.equal(footer);
    expect(root.querySelectorAll('img').length).to.eql(0);
    const images = [...footer.querySelectorAll('img')];
    expect(images.map((image) => ({
      src: image.getAttribute('src'),
      width: image.getAttribute('width'),
      height: image.getAttribute('height'),
      alt: image.getAttribute('alt'),
    }))).to.eql([
      {
        src: './images/wax-seal.v1.png?no-inline',
        width: '64',
        height: '64',
        alt: 'Red wax seal',
      },
      {
        src: '/images/wax-seal.v1.png',
        width: '64',
        height: '64',
        alt: 'Red wax seal',
      },
    ]);
    expect([...footer.querySelectorAll('figcaption strong')].map((el) => el.textContent)).to.eql([
      'Vite-managed image',
      'Public file',
    ]);
    expect([...footer.querySelectorAll('figcaption span')].map((el) => el.textContent)).to.eql([
      'Fingerprinted filename',
      'Filename is preserved',
    ]);
    expect([...footer.querySelectorAll('figcaption code')].map((el) => el.textContent)).to.eql([
      'pkg/a.[hash].png',
      'images/wax-seal.v1.png',
    ]);
    expect([...footer.querySelectorAll('a')].map((link) => ({
      text: link.textContent,
      href: link.getAttribute('href'),
    }))).to.eql([{
      text: 'public R2',
      href: 'https://developers.cloudflare.com/r2/buckets/public-buckets/',
    }]);
    expect(footer.querySelectorAll('script').length).to.eql(0);
    expect(source.data).not.to.include('%BASE_URL%');
  });
});
