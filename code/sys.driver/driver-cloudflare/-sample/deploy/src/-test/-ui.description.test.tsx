import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from '../-test.ts';
import { App } from '../ui/ui.App.tsx';

describe('R2 deployment sample: delivery description', () => {
  it('application origin → linked current host and port, not a hardcoded local address', () => {
    for (const origin of ['http://localhost:8080', 'https://sample.example.test']) {
      const html = renderToStaticMarkup(<App origin={origin} />);
      expect(html).to.include('<a href="/api/hello">/api</a>');
      expect(html).not.to.include('href="/api"');
      expect(html).to.include(
        `application origin (<a href="${origin}">${new URL(origin).host}</a>).`,
      );
    }
  });

  it('keeps server-side presigned GET delivery explicit in the rendered view', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).to.include('short-lived presigned GET URLs');
    expect(html).to.include('https://developers.cloudflare.com/r2/api/s3/presigned-urls/');
    expect(html).to.include('the browser receives bytes, not signed URLs or R2 credentials.');
  });

  it('distinguishes direct public assets, same-origin fetches, and the private-shell digest', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).to.include('UI scripts and styles load directly');
    expect(html).to.include('avoiding Deno egress for those assets.');
    expect(html).to.include('<code>index.html</code> and <code>dist.json</code>');
    expect(html).to.include(
      '<a href="https://developers.cloudflare.com/r2/api/tokens/">private R2</a>',
    );
    expect(html).to.include('and served through a bounded relay');
    expect(html).not.to.include('sw.js');
    expect(html).to.include('href="/api/hello"');
    expect(html).to.include('href="/ui/dist.json"');
    expect(html).to.include('dist.json → hash.digest');
  });

  it('identity table → distinguishes the stored field from the whole-file checksum', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).to.include('<table');
    expect(html).to.include('<th scope="col">What</th>');
    expect(html).to.include('Checksum of <code>dist.json</code>');
    expect(html).to.include('dist.json → hash.digest');
    expect(html.indexOf('dist.json → hash.digest')).to.be.lessThan(
      html.indexOf('Checksum of <code>dist.json</code>'),
    );
    expect(html).to.include(
      '<caption>Private relay — <a href="/ui/dist.json">/ui/dist.json</a></caption>',
    );
    expect(html).to.include('Find in terminal');
    expect(html).to.include('<code>deno task build</code> → <code>private:</code>');
    expect(html).to.include('<code>deno task serve</code> → <code>shell</code>');
  });
});
