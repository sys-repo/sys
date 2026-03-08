import { describe, expect, it } from '../../-test.ts';
import { toViteNpmSpecifier } from '../u.npm.ts';

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

    it('leaves already-normalized package ids unchanged', () => {
      expect(toViteNpmSpecifier('@noble/hashes/legacy.js')).to.eql('@noble/hashes/legacy.js');
    });
  });
});
