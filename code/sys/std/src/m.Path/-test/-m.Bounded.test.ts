import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { Bounded, Path } from '../mod.ts';

describe('Path.Bounded', () => {
  const invalid: t.PathBounded.Invalid = (message) => new TypeError(message);

  it('API', async () => {
    const m = await import('@sys/std/path');

    expect(m.Bounded).to.equal(Bounded);
    expect(m.Path.Bounded).to.equal(Bounded);
    expect(Path.Bounded).to.equal(Bounded);
    expect(Path.Bounded.posix()).to.equal(Bounded.posix());
    expect(Object.isFrozen(Bounded)).to.eql(true);
    expect(Object.isFrozen(Bounded.Is)).to.eql(true);
    expect(Object.isFrozen(Bounded.posix())).to.eql(true);
    expect('Is' in Bounded.posix()).to.eql(false);
    expect(() => {
      (Bounded.posix() as { normalize: unknown }).normalize = () => '../outside';
    }).to.throw(TypeError);
    expectTypeOf(Bounded).toEqualTypeOf<t.PathBounded.Lib>();
  });

  it('detects Windows drive prefixes without needing host OS semantics', () => {
    expect(Bounded.Is.windowsDrive('C:/Windows/system.ini')).to.eql(true);
    expect(Bounded.Is.windowsDrive('z:relative')).to.eql(true);
    expect(Bounded.Is.windowsDrive('docs/readme.md')).to.eql(false);
  });

  it('normalizes safe visible paths to root-relative POSIX paths', () => {
    const path = Bounded.posix();

    expect(Bounded.visible(path, undefined, invalid)).to.eql('');
    expect(Bounded.visible(path, '', invalid)).to.eql('');
    expect(Bounded.visible(path, '.', invalid)).to.eql('');
    expect(Bounded.visible(path, './docs/readme.md', invalid)).to.eql('docs/readme.md');
    expect(Bounded.visible(path, 'docs//nested/./guide.md', invalid)).to.eql(
      'docs/nested/guide.md',
    );
  });

  it('derives parents through bounded visible-path canonicalization', () => {
    expect(Bounded.parent('./docs/nested/guide.md', invalid)).to.eql('docs/nested');
    expect(Bounded.parent('readme.md', invalid)).to.eql('');
    expect(() => Bounded.parent('../outside.txt' as t.StringRelativePath, invalid)).to.throw(
      TypeError,
      'Path cannot traverse above root',
    );
  });

  it('rejects unsafe visible path input before a bounded backing can use it', () => {
    const path = Bounded.posix();
    const invalidInputs = [
      123,
      '/etc/passwd',
      'C:/Windows/system.ini',
      'docs\\readme.md',
      'bad\0path',
      '..',
      '../outside.txt',
      'docs/..',
      'docs/../readme.md',
      'docs/../../outside.txt',
    ];

    for (const input of invalidInputs) {
      expect(() => Bounded.visible(path, input, invalid)).to.throw(TypeError);
    }
  });

  it('uses native default errors and caller-supplied factories for domain-scoped failures', () => {
    const path = Bounded.posix();

    expect(() => Bounded.visible(path, '/etc/passwd')).to.throw(
      Error,
      'Path must be root-relative',
    );
    expect(() => Bounded.visible(path, '../outside.txt', invalid)).to.throw(
      TypeError,
      'Path cannot traverse above root',
    );
  });

  it('rejects paths made unsafe by hostile path-normalization implementations', () => {
    const absoluteAfterNormalize: t.PathBounded.Ops = {
      isAbsolute: () => false,
      normalize: () => '/outside',
    };
    const driveAfterNormalize: t.PathBounded.Ops = {
      isAbsolute: () => false,
      normalize: () => 'C:/outside',
    };
    const traversalAfterNormalize: t.PathBounded.Ops = {
      isAbsolute: () => false,
      normalize: () => '../outside',
    };
    const trailingTraversalAfterNormalize: t.PathBounded.Ops = {
      isAbsolute: () => false,
      normalize: () => 'safe/..',
    };
    const nulAfterNormalize: t.PathBounded.Ops = {
      isAbsolute: () => false,
      normalize: () => 'bad\0path',
    };

    expect(() => Bounded.visible(absoluteAfterNormalize, 'safe.txt', invalid)).to.throw(TypeError);
    expect(() => Bounded.visible(driveAfterNormalize, 'safe.txt', invalid)).to.throw(TypeError);
    expect(() => Bounded.visible(traversalAfterNormalize, 'safe.txt', invalid)).to.throw(
      TypeError,
    );
    expect(() => Bounded.visible(trailingTraversalAfterNormalize, 'safe.txt', invalid)).to.throw(
      TypeError,
    );
    expect(() => Bounded.visible(nulAfterNormalize, 'safe.txt', invalid)).to.throw(TypeError);
  });

  it('provides deterministic POSIX path operations for structural backings', () => {
    const path = Bounded.posix();

    expect(path.isAbsolute('/root')).to.eql(true);
    expect(path.isAbsolute('C:/root')).to.eql(true);
    expect(path.isAbsolute('docs/readme.md')).to.eql(false);
    expect(path.join('/root', 'docs', '..', 'readme.md')).to.eql('/root/readme.md');
    expect(path.resolve('/root', 'docs/readme.md')).to.eql('/root/docs/readme.md');
    expect(path.relative('/root/docs', '/root/docs/nested/guide.md')).to.eql('nested/guide.md');
    expect(path.relative('/root/docs/nested', '/root/readme.md')).to.eql('../../readme.md');

    expectTypeOf(path.resolve('/root', 'docs/readme.md')).toMatchTypeOf<t.StringAbsolutePath>();
  });
});
