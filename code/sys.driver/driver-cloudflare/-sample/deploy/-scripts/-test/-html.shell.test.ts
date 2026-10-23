import { DomMock } from '@sys/std/testing/server/dom';
import { afterEach, beforeEach } from '@sys/testing/server';
import { describe, expect, Fs, Is, it, ROOT } from './common.ts';

describe('R2 deployment sample: HTML shell', () => {
  DomMock.init({ beforeEach, afterEach });

  it('source entry → empty React root and module script, without authored page content', async () => {
    const source = await Fs.readText(Fs.join(ROOT, 'src/ui/index.html'));
    if (!source.ok || !Is.str(source.data)) throw new Error('Sample HTML must be readable.');
    const body = /<body>([\s\S]*?)<\/body>/.exec(source.data)?.[1];
    if (!Is.str(body)) throw new Error('Sample body must exist.');
    // Parse inertly: these source-contract assertions must not execute scripts or fetch assets.
    const template = document.createElement('template');
    template.innerHTML = body;
    expect([...template.content.children].map((el) => el.tagName)).to.eql(['DIV', 'SCRIPT']);
    const root = template.content.querySelector('#root');
    if (!root) throw new Error('Sample root must exist.');
    expect(root.innerHTML).to.eql('');
    expect(template.content.textContent?.trim()).to.eql('');
    const entry = template.content.querySelector('script');
    expect(entry?.getAttribute('type')).to.eql('module');
    expect(entry?.getAttribute('src')).to.eql('./-entry.tsx');
    expect(entry?.textContent).to.eql('');
    expect(root.nextElementSibling).to.equal(entry);
    expect(source.data).not.to.include('vite-ignore');
    expect(source.data).not.to.include('%BASE_URL%');
  });
});
