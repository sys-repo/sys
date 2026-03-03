import { describe, expect, it } from '../../-test.ts';
import { DevParse, REGEX } from '../u.dev.ts';

describe('Vite.dev parser invariants', () => {
  describe('DevParse.url', () => {
    it('extracts and canonicalizes the Local URL', () => {
      const line = '➜  Local:   http://localhost:5173/';
      const res = DevParse.url(line, REGEX.LOCAL_URL);
      expect(res).to.eql('http://localhost:5173/');
    });

    it('extracts and canonicalizes the Network URL', () => {
      const line = '➜  Network: http://192.168.1.100:5173';
      const res = DevParse.url(line, REGEX.NETWORK_URL);
      expect(res).to.eql('http://192.168.1.100:5173/');
    });

    it('returns empty when the line does not match the requested kind', () => {
      const line = '➜  Network: http://192.168.1.100:5173/';
      const res = DevParse.url(line, REGEX.LOCAL_URL);
      expect(res).to.eql('');
    });

    it('returns empty for invalid urls', () => {
      const line = '➜  Local:   http://';
      const res = DevParse.url(line, REGEX.LOCAL_URL);
      expect(res).to.eql('');
    });
  });

  describe('DevParse.port', () => {
    it('returns parsed port from a valid URL', () => {
      const res = DevParse.port('http://localhost:5173/', 1234);
      expect(res).to.eql(5173);
    });

    it('falls back when URL has no explicit port', () => {
      const res = DevParse.port('http://localhost/', 1234);
      expect(res).to.eql(1234);
    });

    it('falls back on invalid URL strings', () => {
      const res = DevParse.port('not-a-url', 1234);
      expect(res).to.eql(1234);
    });
  });
});
