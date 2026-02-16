import { describe, expect, it } from '../../../-test.ts';
import { Origin } from '../m.Origin.ts';

describe('Origin', () => {
  describe('Origin.create', () => {
    it('builds localhost/production origins', () => {
      const res = Origin.create(4040, 'slc.db.team');
      expect(res).to.eql({
        localhost: Origin.parse('http://localhost:4040'),
        production: Origin.parse('https://slc.db.team'),
      });
    });
  });

  describe('Origin.parse', () => {
    it('returns object input as-is', () => {
      const input = {
        app: 'https://example.com/app',
        cdn: { default: 'https://cdn.example.com', video: 'https://video.cdn.example.com' },
      };
      const res = Origin.parse(input);
      expect(res).to.equal(input);
    });

    it('parses localhost urls into app/cdn paths', () => {
      const res = Origin.parse('http://localhost:4040');
      expect(res).to.eql({
        app: 'http://localhost:4040/staging/slc/',
        cdn: {
          default: 'http://localhost:4040/staging/slc.cdn/',
          video: 'http://localhost:4040/staging/slc.cdn.video/',
        },
      });
    });

    it('parses production hostnames into app/cdn subdomains', () => {
      const res = Origin.parse('https://slc.db.team');
      expect(res).to.eql({
        app: 'https://slc.db.team/',
        cdn: {
          default: 'https://cdn.slc.db.team/',
          video: 'https://video.cdn.slc.db.team/',
        },
      });
    });
  });
});
