import { describe, expect, Fs, it } from '../../-test.ts';
import {
  resolveEndpointRef,
  trustIdentityOf,
  type EndpointRefKind,
  type EndpointRefResolver,
} from '../u/endpoints.ts';

const ROOT = Fs.resolve('./.tmp/cell.endpoint-ref');

describe('Cell endpoint refs', () => {
  it('normalizes only JSR authority for trust identity', () => {
    expect(trustIdentityOf('@sys/tools/serve')).to.eql('@sys/tools/serve');
    expect(trustIdentityOf('jsr:@sys/tools/serve')).to.eql('@sys/tools/serve');
    expect(trustIdentityOf('npm:@sys/tools/serve')).to.eql('npm:@sys/tools/serve');
  });

  it('trusts JSR sys refs by identity and selects local workspace resolution', () => {
    const specifier = 'file:///workspace/sys.tools/src/cli.serve/mod.ts';
    const ref = endpointRef({
      from: 'jsr:@sys/tools/serve',
      resolve: () => specifier,
    });

    expect(ref).to.eql({
      from: 'jsr:@sys/tools/serve',
      identity: '@sys/tools/serve',
      specifier,
      source: 'trusted',
      authority: 'jsr',
    });
  });

  it('keeps public JSR authority when no workspace override resolves', () => {
    const ref = endpointRef({
      from: 'jsr:@sys/tools/serve',
      resolve: (specifier) => specifier,
    });

    expect(ref.identity).to.eql('@sys/tools/serve');
    expect(ref.specifier).to.eql('jsr:@sys/tools/serve');
    expect(ref.authority).to.eql('jsr');
  });

  it('accepts resolvable bare sys refs for workspace/import-map callers', () => {
    const specifier = 'file:///workspace/sys.tools/src/cli.serve/mod.ts';
    const ref = endpointRef({
      from: '@sys/tools/serve',
      resolve: () => specifier,
    });

    expect(ref.identity).to.eql('@sys/tools/serve');
    expect(ref.specifier).to.eql(specifier);
    expect(ref.source).to.eql('trusted');
    expect(ref.authority).to.eql('bare');
  });

  it('fails clearly when a bare package ref is not resolvable', () => {
    const error = catchEndpointRef({
      from: '@sys/tools/serve',
      resolve: () => {
        throw new TypeError('Import "@sys/tools/serve" not a dependency');
      },
    });

    expect(error?.message).to.eql(
      "Cell.Services.verify: failed to resolve service import for 'view': @sys/tools/serve. Use explicit 'jsr:' refs for portable descriptors.",
    );
  });

  it('does not trust npm or other JSR scopes by default', () => {
    const npmError = catchEndpointRef({ from: 'npm:@sys/tools/serve' });
    const otherError = catchEndpointRef({ from: 'jsr:@other/pkg' });

    expect(npmError?.message).to.eql(
      "Cell.Services.verify: untrusted service import for 'view': npm:@sys/tools/serve",
    );
    expect(otherError?.message).to.eql(
      "Cell.Services.verify: untrusted service import for 'view': jsr:@other/pkg",
    );
  });

  it('resolves relative refs inside the Cell root without package trust', () => {
    const root = Fs.join(ROOT, 'local');
    const ref = endpointRef({ root, from: './-services/local.ts' });

    expect(ref.identity).to.eql('./-services/local.ts');
    expect(ref.specifier).to.eql(String(Fs.Path.toFileUrl(Fs.join(root, '-services/local.ts'))));
    expect(ref.source).to.eql('local');
    expect(ref.authority).to.eql('relative');
  });

  it('allows relative local refs that start with dot-dot inside the Cell root', () => {
    const root = Fs.join(ROOT, 'dotcache');
    const ref = endpointRef({ root, from: './..cache/local.ts' });

    expect(ref.specifier).to.eql(String(Fs.Path.toFileUrl(Fs.join(root, '..cache/local.ts'))));
    expect(ref.identity).to.eql('./..cache/local.ts');
    expect(ref.source).to.eql('local');
    expect(ref.authority).to.eql('relative');
  });

  it('rejects escaping relative refs and absolute local paths', () => {
    const escapingError = catchEndpointRef({ from: './../service.ts' });
    const absoluteError = catchEndpointRef({ from: Fs.resolve('./service.ts') });

    expect(escapingError?.message).to.eql(
      "Cell.Services.verify: local service import for 'view' escapes Cell root: ./../service.ts",
    );
    expect(absoluteError?.message).to.contain(
      "Cell.Services.verify: absolute service import for 'view' is not allowed:",
    );
  });

  it('uses task wording for task endpoint refs', () => {
    const error = catchEndpointRef({
      from: 'npm:fake-package',
      kind: 'task',
      context: 'Cell.Task.verify',
      name: 'capture',
    });

    expect(error?.message).to.eql(
      "Cell.Task.verify: untrusted task import for 'capture': npm:fake-package",
    );
  });
});

function endpointRef(input: EndpointRefInput) {
  return resolveEndpointRef({
    root: input.root ?? ROOT,
    from: input.from,
    name: input.name ?? 'view',
    kind: input.kind ?? 'service',
    context: input.context ?? 'Cell.Services.verify',
    trusted: input.trusted,
    resolve: input.resolve,
  });
}

function catchEndpointRef(input: EndpointRefInput): Error | undefined {
  try {
    endpointRef(input);
  } catch (err) {
    return err as Error;
  }
}

type EndpointRefInput = {
  readonly root?: string;
  readonly from: string;
  readonly name?: string;
  readonly kind?: EndpointRefKind;
  readonly context?: string;
  readonly trusted?: readonly string[];
  readonly resolve?: EndpointRefResolver;
};
