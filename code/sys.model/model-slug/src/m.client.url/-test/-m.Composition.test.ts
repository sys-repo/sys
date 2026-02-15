import { describe, expect, it } from '../../-test.ts';

import type { t } from '../common.ts';
import { D } from '../common.ts';
import { Composition } from '../m.Composition.ts';

describe('SlugUrl.Composition', () => {
  describe('manifestsLocation', () => {
    it('uses defaults when no overrides provided', () => {
      const res = Composition.manifestsLocation('https://cdn.example.com/base/');
      expect(res).to.eql({
        baseUrl: 'https://cdn.example.com/base/',
        manifestsDir: D.manifestsDir,
      });
    });

    it('respects manifestBase and manifestsDir overrides', () => {
      const opts: t.SlugLoadOptions = {
        urls: { manifestBase: 'https://manifest.example.com/' },
        layout: { manifestsDir: 'custom-manifests' },
      };
      const res = Composition.manifestsLocation('https://cdn.example.com/base/', opts);
      expect(res).to.eql({
        baseUrl: 'https://manifest.example.com/',
        manifestsDir: 'custom-manifests',
      });
    });
  });

  describe('contentLocation', () => {
    it('uses defaults when no overrides provided', () => {
      const res = Composition.contentLocation('https://cdn.example.com/base/');
      expect(res).to.eql({
        baseUrl: 'https://cdn.example.com/base/',
        contentDir: D.contentLocation,
      });
    });

    it('respects contentBase and contentDir overrides', () => {
      const opts: t.SlugLoadOptions = {
        urls: { contentBase: 'https://content.example.com/' },
        layout: { contentDir: 'custom-content' },
      };
      const res = Composition.contentLocation('https://cdn.example.com/base/', opts);
      expect(res).to.eql({
        baseUrl: 'https://content.example.com/',
        contentDir: 'custom-content',
      });
    });
  });

  describe('builders', () => {
    it('manifests joins base + manifests dir + filename', () => {
      const href = Composition.manifests({
        baseUrl: 'https://cdn.example.com/base/',
        manifestsDir: '-manifests',
        filename: 'dist.json',
      });
      expect(href).to.eql('https://cdn.example.com/base/-manifests/dist.json');
    });

    it('content joins base + content dir + filename', () => {
      const href = Composition.content({
        baseUrl: 'https://cdn.example.com/base/',
        contentDir: 'content',
        filename: 'sha256-x.json',
      });
      expect(href).to.eql('https://cdn.example.com/base/content/sha256-x.json');
    });

    it('descriptor joins origin + manifests path + filename', () => {
      const href = Composition.descriptor({
        origin: 'https://origin.example.com/',
        manifests: '-manifests',
        filename: 'dist.client.json',
      });
      expect(href).to.eql('https://origin.example.com/-manifests/dist.client.json');
    });
  });
});
