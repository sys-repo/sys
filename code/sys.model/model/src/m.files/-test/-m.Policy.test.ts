import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Policy } from '../m.Policy.ts';
import { Files } from '../mod.ts';

describe('Files.Policy', () => {
  it('API', () => {
    expect(Files.Policy).to.equal(Policy);
    expectTypeOf(Policy).toEqualTypeOf<t.Files.Policy.Lib>();
  });

  it('readonly: expands one allow-list across read-oriented capabilities', () => {
    const policy = Policy.readonly('docs/**/*.md', {
      deny: 'docs/private/**',
      maxReadBytes: 1024,
    });

    expect(policy).to.eql({
      list: 'docs/**/*.md',
      stat: 'docs/**/*.md',
      read: 'docs/**/*.md',
      watch: 'docs/**/*.md',
      manifest: true,
      deny: 'docs/private/**',
      maxReadBytes: 1024,
    });

    expectTypeOf(policy).toEqualTypeOf<t.Files.Policy.Shape>();
  });

  it('readonly: can override or disable watch', () => {
    const overridden = Policy.readonly('docs/**', { watch: 'docs/live/**' });
    const disabled = Policy.readonly('docs/**', { watch: false });

    expect(overridden).to.eql({
      list: 'docs/**',
      stat: 'docs/**',
      read: 'docs/**',
      watch: 'docs/live/**',
      manifest: true,
    });

    expect(disabled).to.eql({
      list: 'docs/**',
      stat: 'docs/**',
      read: 'docs/**',
      manifest: true,
    });
  });
});
