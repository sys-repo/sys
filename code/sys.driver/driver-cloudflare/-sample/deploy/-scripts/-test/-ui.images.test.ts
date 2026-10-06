import { DomMock } from '@sys/std/testing/server/dom';
import { afterEach, beforeEach } from '@sys/testing/server';
import { describe, expect, Fs, it, ROOT } from './common.ts';

describe('R2 deployment sample: native image examples', () => {
  DomMock.init({ beforeEach, afterEach });

  it('same artwork → three delivery examples outside the application root', async () => {
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
    const fallbackLinks = [...root.querySelectorAll('a')];
    expect(fallbackLinks.map((link) => link.getAttribute('href'))).to.eql([
      '/api/hello',
      '/ui/dist.json',
    ]);
    const images = [...footer.querySelectorAll('img')];
    const actualImages = images.map((image) => {
      return {
        src: image.getAttribute('src'),
        width: image.getAttribute('width'),
        height: image.getAttribute('height'),
        alt: image.getAttribute('alt'),
      };
    });
    expect(actualImages).to.eql([
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
      {
        src: '/ui/images/wax-seal.v1.png',
        width: '64',
        height: '64',
        alt: 'Red wax seal',
      },
    ]);
    expect(images.map((image) => image.hasAttribute('vite-ignore'))).to.eql([false, false, true]);
    const labels = [...footer.querySelectorAll('figcaption strong')].map((el) => el.textContent);
    expect(labels).to.eql([
      'Vite-managed asset',
      'Public file',
      'Private file',
    ]);
    const descriptions = [...footer.querySelectorAll('figcaption span')].map((el) => {
      return el.textContent;
    });
    expect(descriptions).to.eql([
      'Fingerprinted filename',
      'Preserved filename',
      'Preserved filename',
    ]);
    const filenames = [...footer.querySelectorAll('figcaption code')].map((el) => el.textContent);
    expect(filenames).to.eql([
      'pkg/a.[hash].png',
      'images/wax-seal.v1.png',
      'images/wax-seal.v1.png ↗',
    ]);
    const imageLinks = [...footer.querySelectorAll('figcaption code a')];
    expect(imageLinks.map((link) => link.getAttribute('href'))).to.eql([
      '/ui/images/wax-seal.v1.png',
    ]);
    expect(footer.querySelector('figure:first-child code a')).to.eql(null);
    expect(footer.querySelector('figure:nth-child(2) code a')).to.eql(null);
    expect(template.content.querySelectorAll('[data-image-link]').length).to.eql(0);
    const links = [...footer.querySelectorAll('a')];
    expect(links.length).to.eql(4);
    for (const link of [...fallbackLinks, ...links]) {
      expect(link.getAttribute('target')).to.eql('_blank');
      expect(link.getAttribute('rel')).to.eql('noopener noreferrer');
      expect(link.getAttribute('title')).to.eql('Opens in a new tab');
      expect(link.textContent?.endsWith(' ↗')).to.eql(true);
    }
    const captions = [...footer.querySelectorAll('figcaption')];
    expect(captions.length).to.eql(3);
    for (const [index, caption] of captions.entries()) {
      expect(caption.previousElementSibling?.tagName).to.eql('IMG');
      const childTags = [...caption.children].map((el) => el.tagName);
      expect(childTags).to.eql(['STRONG', 'SPAN', 'A', 'CODE']);
      const delivery = caption.querySelector(':scope > a');
      expect(delivery?.textContent).to.eql(index === 2 ? 'Private R2 ↗' : 'Public R2 ↗');
      expect(delivery?.getAttribute('href')).to.eql(
        index === 2
          ? 'https://developers.cloudflare.com/r2/api/tokens/'
          : 'https://developers.cloudflare.com/r2/buckets/public-buckets/',
      );
      expect(delivery?.nextElementSibling).to.equal(caption.querySelector('code'));
    }
    expect(footer.querySelectorAll('p').length).to.eql(0);
    expect(footer.querySelectorAll('script').length).to.eql(0);
    expect(source.data).not.to.include('%BASE_URL%');
  });
});
