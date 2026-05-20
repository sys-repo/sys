import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Authority } from '../m.Authority.ts';
import { Files } from '../mod.ts';
import { Fixture } from './u.fixture.authority.ts';

const SUPPORTS_READ_MANIFEST = {
  list: true,
  stat: true,
  read: true,
  manifest: true,
} satisfies Partial<t.FilesCapability.Map>;

describe('Files.Authority', () => {
  it('API', () => {
    expect(Files.Authority).to.equal(Authority);
    expectTypeOf(Authority).toEqualTypeOf<t.FilesAuthority.Lib>();
  });

  it('projects capabilities from backing support facts and resolved policy', () => {
    const authority = Authority.resolve({
      policy: { read: 'docs/**', manifest: true, maxReadBytes: 64 },
      backing: {
        supports: { list: true, read: true, write: true, manifest: true },
        fidelity: 'dynamic',
        maxReadBytes: 128,
        encodings: ['utf8'],
      },
    });

    expect(authority.capabilities).to.eql({
      list: true,
      stat: false,
      read: true,
      write: true,
      remove: false,
      watch: false,
      manifest: true,
      fidelity: 'dynamic',
      maxReadBytes: 64,
      encodings: ['utf8'],
    });
    expect(Object.isFrozen(authority.capabilities)).to.eql(true);
    expect(Object.isFrozen(authority.capabilities.encodings)).to.eql(true);
  });

  it('owns strictest maxReadBytes reconciliation and validates inputs once', () => {
    const fromBacking = Authority.resolve({
      policy: { read: '**', maxReadBytes: 256 },
      backing: { supports: { read: true }, maxReadBytes: 32 },
    });
    const fromPolicy = Authority.resolve({
      policy: { read: '**', maxReadBytes: 16 },
      backing: { supports: { read: true }, maxReadBytes: 128 },
    });

    expect(fromBacking.capabilities.maxReadBytes).to.eql(32);
    expect(fromPolicy.capabilities.maxReadBytes).to.eql(16);

    const error = (() => {
      try {
        Authority.resolve({
          policy: { read: '**', maxReadBytes: -1 as t.NumberBytes },
          backing: { supports: { read: true } },
        });
      } catch (cause) {
        return cause;
      }
    })();
    expect(error).to.be.instanceOf(Error);
    expect((error as Error).name).to.eql('FilesAuthorityError.InvalidPath');
  });

  it('checks support, allow, deny, and manifest from one resolved authority value', () => {
    const authority = Authority.resolve({
      policy: { read: 'docs/**', deny: 'docs/private/**', manifest: true },
      backing: { supports: SUPPORTS_READ_MANIFEST },
    });

    expect(authority.allows('read', 'docs/readme.md')).to.eql(true);
    expect(authority.allows('read', 'docs/private/secret.md')).to.eql(false);
    expect(authority.allows('write', 'docs/readme.md')).to.eql(false);
    expect(authority.allows('manifest')).to.eql(true);

    authority.check('read', 'docs/readme.md');
    expectError(() => authority.check('read', 'docs/private/secret.md'), {
      name: 'FilesAuthorityError.PolicyDenied',
      message: 'Read denied: docs/private/secret.md',
    });
    expectError(() => authority.check('write', 'docs/readme.md'), {
      name: 'FilesAuthorityError.Unsupported',
      message: 'Write unsupported',
    });
  });

  it('overlays a total handler map with capabilities and authority gates', async () => {
    const calls: t.FilesCmd.Name[] = [];
    const authority = Authority.resolve({
      policy: { read: 'docs/**', manifest: true },
      backing: { supports: SUPPORTS_READ_MANIFEST },
    });
    const handlers = authority.handlers(Fixture.handlerMap(calls));

    const capabilities = await handlers['files:capabilities'](
      {},
      Fixture.context('files:capabilities'),
    );
    expect(capabilities).to.eql(authority.capabilities);
    expect(calls).to.eql([]);

    const read = await handlers['files:read'](
      { path: 'docs/readme.md' },
      Fixture.context('files:read'),
    );
    expect(read).to.include({ kind: 'inline', content: 'ok' });
    expect(calls).to.eql(['files:read']);

    const manifest = await handlers['files:manifest']({}, Fixture.context('files:manifest'));
    expect(manifest.capabilities).to.eql(authority.capabilities);
    expect(calls).to.eql(['files:read', 'files:manifest']);

    expectError(
      () => handlers['files:read']({ path: 'secret.txt' }, Fixture.context('files:read')),
      { name: 'FilesAuthorityError.PolicyDenied', message: 'Read denied: secret.txt' },
    );
    expectError(
      () =>
        handlers['files:write'](
          { kind: 'text', path: 'docs/readme.md', content: 'nope' },
          Fixture.context('files:write'),
        ),
      { name: 'FilesAuthorityError.Unsupported', message: 'Write unsupported' },
    );
    expect(calls).to.eql(['files:read', 'files:manifest']);
  });
});

function expectError(
  fn: () => unknown,
  expected: { readonly name: string; readonly message: string },
) {
  try {
    fn();
  } catch (cause) {
    expect(cause).to.be.instanceOf(Error);
    const error = cause as Error;
    expect(error.name).to.eql(expected.name);
    expect(error.message).to.eql(expected.message);
    return;
  }
  throw new Error(`Expected ${expected.name}: ${expected.message}`);
}
