import { describe, DomMock, expect, it } from '../-test.ts';
import { Is } from '../mod.ts';

describe('Is (browser environment)', { sanitizeResources: false, sanitizeOps: false }, () => {
  describe('Is.browser', () => {
    it('Is.browser: false', () => {
      expect(Is.browser()).to.eql(false);
    });

    it('Is.browser: true', () => {
      DomMock.polyfill();
      expect(Is.browser()).to.eql(true);
      DomMock.unpolyfill();
    });
  });

  describe('Is.localhost', () => {
    it('Is.localhost: true', () => {
      const url = 'http://localhost:1234';
      DomMock.polyfill({ url });
      expect(Is.browser()).to.eql(true);

      expect(Is.localhost()).to.eql(true);
      expect(Is.localhost(window.location)).to.eql(true);
      expect(Is.localhost('http://localhost')).to.eql(true);
      expect(Is.localhost(url)).to.eql(true);

      DomMock.unpolyfill();
    });

    it('Is.localhost: false', () => {
      const url = 'https://domain.com';
      DomMock.polyfill({ url });

      expect(Is.localhost()).to.eql(false);
      expect(Is.localhost(window.location)).to.eql(false);
      expect(Is.localhost(url)).to.eql(false);

      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value: any) => expect(Is.localhost(value)).to.eql(false, value));

      DomMock.unpolyfill();
    });
  });
});
