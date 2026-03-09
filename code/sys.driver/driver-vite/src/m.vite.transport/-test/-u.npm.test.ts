import { describe, expect, it } from '../../-test.ts';
import { isBarePackageId, toViteNpmSpecifier } from '../u.npm.ts';

describe('ViteTransport.npm', () => {
  describe('specifier normalization', () => {
    it('strips versions from unscoped npm packages', () => {
      expect(toViteNpmSpecifier('npm:react@19.2.0')).to.eql('react');
    });

    it('preserves unscoped npm subpaths when stripping versions', () => {
      expect(toViteNpmSpecifier('npm:react-dom@19.2.0/client')).to.eql('react-dom/client');
    });

    it('strips versions from scoped npm packages', () => {
      expect(toViteNpmSpecifier('npm:@noble/hashes@2.0.1')).to.eql('@noble/hashes');
    });

    it('preserves scoped npm subpaths when stripping versions', () => {
      expect(toViteNpmSpecifier('npm:@noble/hashes@2.0.1/legacy.js')).to.eql(
        '@noble/hashes/legacy.js',
      );
    });


    it('normalizes npm slash-prefixed scoped subpaths from deno info output', () => {
      expect(toViteNpmSpecifier('npm:/@noble/hashes@2.0.1/legacy.js')).to.eql(
        '@noble/hashes/legacy.js',
      );
    });

    it('leaves already-normalized package ids unchanged', () => {
      expect(toViteNpmSpecifier('@noble/hashes/legacy.js')).to.eql('@noble/hashes/legacy.js');
    });
  });

  describe('package id detection', () => {
    it('identifies bare package ids', () => {
      expect(isBarePackageId('@noble/hashes/legacy.js')).to.eql(true);
      expect(isBarePackageId('react')).to.eql(true);
    });

    it('rejects file and encoded ids', () => {
      expect(isBarePackageId('./local.ts')).to.eql(false);
      expect(isBarePackageId('/tmp/local.ts')).to.eql(false);
      expect(isBarePackageId('file:///tmp/local.ts')).to.eql(false);
      expect(isBarePackageId('\0deno::TypeScript::id::/tmp/local.ts')).to.eql(false);
    });
  });
});
