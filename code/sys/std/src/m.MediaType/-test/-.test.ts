import { describe, expect, it } from '../../-test.ts';
import { MediaType } from '../mod.ts';

describe('MediaType', () => {
  it('API', async () => {
    const m = await import('@sys/std/media-type');
    expect(m.MediaType).to.equal(MediaType);
  });

  describe('resolution', () => {
    it('resolves standard extensions without a shadow registry', () => {
      expect(MediaType.fromExtension('html')).to.equal('text/html');
      expect(MediaType.fromExtension('.JSON')).to.equal('application/json');
      expect(MediaType.fromExtension('js')).to.equal('text/javascript');
      expect(MediaType.fromExtension('yaml')).to.equal('text/yaml');
      expect(MediaType.fromExtension('md')).to.equal('text/markdown');
      expect(MediaType.fromExtension('svg')).to.equal('image/svg+xml');
      expect(MediaType.fromExtension('unknown')).to.equal(undefined);
      expect(MediaType.fromExtension('file.json')).to.equal(undefined);
    });

    it('keeps source ambiguity inside the named source profile', () => {
      const source = { profile: 'source' } as const;

      expect(MediaType.fromExtension('ts')).to.equal('video/mp2t');
      expect(MediaType.fromExtension('.ts', source)).to.equal('application/typescript');
      expect(MediaType.fromExtension('MTS', source)).to.equal('application/typescript');
      expect(MediaType.fromExtension('.cts', source)).to.equal('application/typescript');
      expect(MediaType.fromExtension('tsx', source)).to.equal('application/typescript+jsx');
      expect(MediaType.fromExtension('json', source)).to.equal('application/json');
    });

    it('resolves only the final path extension and preserves extension-only dotfiles', () => {
      expect(MediaType.fromPath('/assets/index.HTML')).to.equal('text/html');
      expect(MediaType.fromPath('/config/.json')).to.equal('application/json');
      expect(MediaType.fromPath('/archive/file.tar.gz')).to.equal('application/gzip');
      expect(MediaType.fromPath('/assets/file')).to.equal(undefined);
      expect(MediaType.fromPath('/assets/file.json?raw=1')).to.equal(undefined);
      expect(MediaType.fromPath('/src/main.ts', { profile: 'source' })).to.equal(
        'application/typescript',
      );
    });
  });

  describe('data URI parsing', () => {
    it('extracts normalized bare media types without decoding payloads', () => {
      expect(MediaType.fromDataUri('data:text/HTML;charset=UTF-8,hello')).to.equal('text/html');
      expect(MediaType.fromDataUri('data:application/vnd.api+JSON;version=1,{}')).to.equal(
        'application/vnd.api+json',
      );
      expect(MediaType.fromDataUri('data:text/plain;base64,SGVsbG8=')).to.equal('text/plain');
      expect(MediaType.fromDataUri('DATA:text/plain,hello')).to.equal('text/plain');
    });

    it('uses the RFC 2397 default when the media type is omitted', () => {
      expect(MediaType.fromDataUri('data:,hello')).to.equal('text/plain');
      expect(MediaType.fromDataUri('data:;charset=UTF-8,hello')).to.equal('text/plain');
      expect(MediaType.fromDataUri('data:;base64,SGVsbG8=')).to.equal('text/plain');
    });

    it('refuses malformed and non-data inputs', () => {
      expect(MediaType.fromDataUri('https://example.com/file.txt')).to.equal(undefined);
      expect(MediaType.fromDataUri('data:text/plain')).to.equal(undefined);
      expect(MediaType.fromDataUri('data:not-a-media-type,hello')).to.equal(undefined);
      expect(MediaType.fromDataUri('data:text/plain;broken,hello')).to.equal(undefined);
      expect(MediaType.fromDataUri('data:text/plain;,hello')).to.equal(undefined);
      expect(MediaType.fromDataUri('data:text/plain;charset UTF-8,hello')).to.equal(undefined);
      expect(MediaType.fromDataUri('data:text/*,hello')).to.equal(undefined);
      expect(MediaType.fromDataUri('data:text/plain;base64;charset=UTF-8,hello')).to.equal(
        undefined,
      );
    });
  });

  describe('Content-Type formatting', () => {
    it('separates bare media types from formatted Content-Type values', () => {
      expect(MediaType.toContentType('text/html')).to.equal('text/html; charset=UTF-8');
      expect(MediaType.toContentType('application/json')).to.equal(
        'application/json; charset=UTF-8',
      );
      expect(MediaType.toContentType('image/svg+xml')).to.equal('image/svg+xml');
      expect(MediaType.toContentType('text/plain; charset=utf-8')).to.equal(
        'text/plain; charset=utf-8',
      );
      expect(MediaType.toContentType('text/plain; format=flowed')).to.equal(
        'text/plain; charset=UTF-8; format=flowed',
      );
      expect(MediaType.toContentType('not-a-media-type')).to.equal(undefined);
      expect(MediaType.toContentType('text/*')).to.equal(undefined);
      expect(MediaType.toContentType('text/plain; charset UTF-8')).to.equal(undefined);
    });
  });

  describe('classification', () => {
    it('validates syntax without requiring registry membership', () => {
      expect(MediaType.Is.valid('application/vnd.example+json; version=1')).to.equal(true);
      expect(MediaType.Is.valid('text/plain; note="a;b"')).to.equal(true);
      expect(MediaType.Is.valid('text/plain; note=""')).to.equal(true);
      expect(MediaType.Is.valid('TEXT/PLAIN')).to.equal(true);
      expect(MediaType.Is.valid('')).to.equal(false);
      expect(MediaType.Is.valid('text')).to.equal(false);
      expect(MediaType.Is.valid('text/plain/extra')).to.equal(false);
      expect(MediaType.Is.valid('*/*')).to.equal(false);
      expect(MediaType.Is.valid('text/*')).to.equal(false);
      expect(MediaType.Is.valid('text/plain;')).to.equal(false);
      expect(MediaType.Is.valid('text/plain; charset UTF-8')).to.equal(false);
      expect(MediaType.Is.valid('text/plain; charset?UTF-8')).to.equal(false);
      expect(MediaType.Is.valid('text/plain; broken')).to.equal(false);
      expect(MediaType.Is.valid(undefined)).to.equal(false);
      expect(MediaType.Is.valid(123)).to.equal(false);
    });

    it('recognizes text and structured textual media types after parsing', () => {
      const textual = [
        'text/plain; charset=UTF-8',
        'application/json',
        'application/vnd.api+json',
        'application/xml',
        'application/atom+xml',
        'application/yaml',
        'application/example+yaml',
        'application/ecmascript',
        'application/javascript',
        'application/x-javascript',
        'application/x-yaml',
        'application/typescript',
        'application/typescript+jsx',
        'image/svg+xml',
      ];

      textual.forEach((mediaType) => expect(MediaType.Is.text(mediaType)).to.equal(true));
      expect(MediaType.Is.text('application/octet-stream; type=text/plain')).to.equal(false);
      expect(MediaType.Is.text('application/vnd.example')).to.equal(false);
      expect(MediaType.Is.text('malformed')).to.equal(false);
    });

    it('classifies only valid non-text media types as binary', () => {
      expect(MediaType.Is.binary('application/octet-stream')).to.equal(true);
      expect(MediaType.Is.binary('image/png')).to.equal(true);
      expect(MediaType.Is.binary('application/vnd.example')).to.equal(true);
      expect(MediaType.Is.binary('text/plain')).to.equal(false);
      expect(MediaType.Is.binary('malformed')).to.equal(false);
      expect(MediaType.Is.binary(undefined)).to.equal(false);
    });
  });

  describe('fallbacks', () => {
    it('exposes explicit caller-selected fallback values', () => {
      expect(MediaType.Fallback.binary).to.equal('application/octet-stream');
      expect(MediaType.Fallback.text).to.equal('text/plain');
    });
  });

  describe('immutability', () => {
    it('freezes the canonical output surfaces', () => {
      expect(Object.isFrozen(MediaType)).to.equal(true);
      expect(Object.isFrozen(MediaType.Is)).to.equal(true);
      expect(Object.isFrozen(MediaType.Fallback)).to.equal(true);
    });
  });
});
