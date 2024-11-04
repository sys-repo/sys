import { describe, expect, it } from '../../-test.ts';
import { WrangleUrl, WrangleUrlParams } from './mod.ts';

describe('Entry', () => {
  it('isDev', () => {
    const isDev = WrangleUrl.navigate.isDev;
    expect(isDev('https://domain.com/')).to.eql(false);
    expect(isDev('https://domain.com/?d')).to.eql(true);
    expect(isDev('https://domain.com/?dev')).to.eql(true);
  });

  it('formatDevFlag', () => {
    const formatDevFlag = WrangleUrlParams.formatDevFlag;
    const res1 = formatDevFlag({ location: 'https://foo.com' });
    const res2 = formatDevFlag({ location: 'https://foo.com?d' });
    const res3 = formatDevFlag({ location: 'https://foo.com', defaultNamespace: 'foobar' });
    const res4 = formatDevFlag({ location: 'https://foo.com?d', defaultNamespace: 'foobar' });
    const res5 = formatDevFlag({ location: 'https://foo.com', forceDev: true });
    const res6 = formatDevFlag({
      location: 'https://foo.com',
      defaultNamespace: 'foobar',
      forceDev: true,
    });
    const res7 = formatDevFlag({ location: 'https://foo.com?dev=zoo', defaultNamespace: 'foobar' });

    expect(res1.href).to.eql('https://foo.com/');
    expect(res2.href).to.eql('https://foo.com/?dev=true');
    expect(res3.href).to.eql('https://foo.com/'); //            | NB: not forced to "dev" mode.
    expect(res4.href).to.eql('https://foo.com/?dev=foobar'); // | NB: Was in dev mode, namespace used rather that 'true'.
    expect(res5.href).to.eql('https://foo.com/?dev=true');
    expect(res6.href).to.eql('https://foo.com/?dev=foobar'); // | NB: namespace forced onto URL.
    expect(res7.href).to.eql('https://foo.com/?dev=zoo'); //    | NB: existing namespace not overwritten.
  });
});
