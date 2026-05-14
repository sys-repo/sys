import { describe, expect, it } from '../../-test.ts';
import { c, type t } from '../common.ts';
import { FmtUrl } from '../u.fmt.url.ts';

describe('FmtUrl', () => {
  it('orders the most base URL last', () => {
    const urls = [
      serviceUrl('http://localhost:8081/'),
      serviceUrl('http://localhost:8081/payments/'),
      serviceUrl('http://localhost:8081/view/'),
      serviceUrl('http://localhost:8081/-/stripe/'),
    ];

    expect(FmtUrl.orderBaseLast(urls).map((url) => url.href)).to.eql([
      'http://localhost:8081/payments/',
      'http://localhost:8081/view/',
      'http://localhost:8081/-/stripe/',
      'http://localhost:8081/',
    ]);
  });

  it('prefers shallower paths, then shorter query/hash variants', () => {
    const urls = [
      serviceUrl('http://localhost:8081/view/'),
      serviceUrl('http://localhost:8081/?preview=true'),
      serviceUrl('http://localhost:8081/#status'),
      serviceUrl('http://localhost:8081/'),
    ];

    expect(FmtUrl.orderBaseLast(urls).map((url) => url.href)).to.eql([
      'http://localhost:8081/view/',
      'http://localhost:8081/?preview=true',
      'http://localhost:8081/#status',
      'http://localhost:8081/',
    ]);
  });

  it('highlights only the selected origin', () => {
    expect(FmtUrl.service(serviceUrl('http://localhost:8081/'), { highlightOrigin: true })).to.eql(
      `${c.cyan('http://localhost:8081')}${c.gray('/')}`,
    );
    expect(FmtUrl.service(serviceUrl('http://localhost:8081/payments/'))).to.eql(
      `${c.gray('http://localhost:8081')}${c.gray('/payments/')}`,
    );
  });
});

function serviceUrl(href: string): t.Service.Url {
  return { href: href as t.StringUrl };
}
