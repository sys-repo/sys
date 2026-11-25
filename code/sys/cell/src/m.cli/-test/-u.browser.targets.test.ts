import { describe, expect, it } from './common.ts';
import { resolveBrowserTargets } from '../u.lifecycle/u.browser.targets.ts';

describe('@sys/cell/cli browser targets', () => {
  it('selects in descriptor and pathname order, independently of publication order', () => {
    const sources = [
      source('proxy', ['/', '/payments/', '/missing', '/'], [
        'http://x/payments/?view=1#receipt',
        'http://x',
        'http://x/',
      ]),
      source('replica', ['/', '//reports', '/%2F'], [
        'http://x/%2F',
        'http://x//reports',
        'http://x/',
      ]),
      source('unconfigured', undefined, ['http://other.test/']),
    ];
    const expected = {
      targets: [
        { service: 'proxy', pathname: '/', href: 'http://x/' },
        { service: 'proxy', pathname: '/payments/', href: 'http://x/payments/?view=1#receipt' },
        { service: 'replica', pathname: '//reports', href: 'http://x//reports' },
        { service: 'replica', pathname: '/%2F', href: 'http://x/%2F' },
      ],
      diagnostics: [{ service: 'proxy', pathname: '/missing', matches: 0 }],
    };
    const reversed = sources.map((item) => ({ ...item, urls: item.urls?.toReversed() }));
    expect(resolveBrowserTargets(sources)).to.eql(expected);
    expect(resolveBrowserTargets(reversed)).to.eql(expected);
  });

  it('diagnoses distinct matches without falling back or normalizing the selector', () => {
    const sources = [
      source('origins', '/', ['http://localhost:5173/', 'http://127.0.0.1:5173/']),
      source('queries', '/', ['http://x/?a', 'http://x/?b', 'http://x/?a']),
      source('fragments', '/', ['http://x/#a', 'http://x/#b']),
      source('paths', ['/payments', '/a/b'], ['http://x/payments/', 'http://x/a%2Fb']),
      source('unreported', '/'),
    ];
    expect(resolveBrowserTargets(sources)).to.eql({
      targets: [],
      diagnostics: [
        { service: 'origins', pathname: '/', matches: 2 },
        { service: 'queries', pathname: '/', matches: 2 },
        { service: 'fragments', pathname: '/', matches: 2 },
        { service: 'paths', pathname: '/payments', matches: 0 },
        { service: 'paths', pathname: '/a/b', matches: 0 },
        { service: 'unreported', pathname: '/', matches: 0 },
      ],
    });
  });

  it('checks service-local ambiguity before deduplicating across services', () => {
    const hrefs = ['https://b.test/ok', 'https://a.test/', 'https://b.test/'];
    for (const published of [hrefs, hrefs.toReversed()]) {
      const sources = [
        source('a', '/', ['https://a.test/']),
        source('b', ['/ok', '/'], published),
      ];
      expect(resolveBrowserTargets(sources)).to.eql({
        targets: [
          { service: 'a', pathname: '/', href: 'https://a.test/' },
          { service: 'b', pathname: '/ok', href: 'https://b.test/ok' },
        ],
        diagnostics: [{ service: 'b', pathname: '/', matches: 2 }],
      });
    }
  });

  it('excludes non-HTTP, malformed, credentialed and control-containing hrefs', () => {
    const sources = [source('view', '/', [
      'ws://example.test/',
      'wss://example.test/',
      'file:///tmp/index.html',
      '//example.test/',
      'http://',
      'http://name:secret@example.test/',
      'http://example.test/\n',
      'http://example.test/?q=\u007f',
      'http://example.test/?q=\u009f',
      'https://example.test/',
    ])];
    expect(resolveBrowserTargets(sources)).to.eql({
      targets: [{ service: 'view', pathname: '/', href: 'https://example.test/' }],
      diagnostics: [],
    });
  });
});

function source(service: string, pathnames?: string | readonly string[], hrefs?: string[]) {
  return { service, pathnames, urls: hrefs?.map((href) => ({ href })) };
}
