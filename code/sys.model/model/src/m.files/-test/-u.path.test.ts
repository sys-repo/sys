import { describe, expect, expectTypeOf, it, Path, type t } from '../../-test.ts';
import { FilesPath, type InvalidPath, type PathOps } from '../u/u.path.ts';

describe('Files/u.path', () => {
  const invalid: InvalidPath = (message) => new Error(message);

  it('exposes Files-domain aliases over @sys/std/path bounded predicates', () => {
    expect(FilesPath.Is).to.equal(Path.Bounded.Is);
    expect(FilesPath.Is.windowsDrive('C:/Windows/system.ini')).to.eql(true);
    expect(FilesPath.Is.windowsDrive('z:relative')).to.eql(true);
    expect(FilesPath.Is.windowsDrive('docs/readme.md')).to.eql(false);
  });

  it('normalizes safe visible paths to root-relative POSIX paths', () => {
    const path = FilesPath.posix();

    expect(FilesPath.visible(path, undefined, invalid)).to.eql('');
    expect(FilesPath.visible(path, '', invalid)).to.eql('');
    expect(FilesPath.visible(path, '.', invalid)).to.eql('');
    expect(FilesPath.visible(path, './docs/readme.md', invalid)).to.eql('docs/readme.md');
    expect(FilesPath.visible(path, 'docs//nested/./guide.md', invalid)).to.eql(
      'docs/nested/guide.md',
    );
  });

  it('derives parents through bounded visible-path canonicalization', () => {
    expect(FilesPath.parent('./docs/nested/guide.md', invalid)).to.eql('docs/nested');
    expect(FilesPath.parent('readme.md', invalid)).to.eql('');
    expect(() => FilesPath.parent('../outside.txt' as t.Files.String.Path, invalid)).to.throw(
      Error,
      'Files path cannot traverse above root',
    );
  });

  it('rejects unsafe visible path input before any backing IO can use it', () => {
    const path = FilesPath.posix();
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
      expect(() => FilesPath.visible(path, input, invalid)).to.throw(Error);
    }
  });

  it('rejects paths made unsafe by hostile path-normalization implementations', () => {
    const absoluteAfterNormalize: PathOps = {
      isAbsolute: () => false,
      normalize: () => '/outside',
    };
    const driveAfterNormalize: PathOps = {
      isAbsolute: () => false,
      normalize: () => 'C:/outside',
    };
    const traversalAfterNormalize: PathOps = {
      isAbsolute: () => false,
      normalize: () => '../outside',
    };
    const trailingTraversalAfterNormalize: PathOps = {
      isAbsolute: () => false,
      normalize: () => 'safe/..',
    };
    const nulAfterNormalize: PathOps = {
      isAbsolute: () => false,
      normalize: () => 'bad\0path',
    };

    expect(() => FilesPath.visible(absoluteAfterNormalize, 'safe.txt', invalid)).to.throw(Error);
    expect(() => FilesPath.visible(driveAfterNormalize, 'safe.txt', invalid)).to.throw(Error);
    expect(() => FilesPath.visible(traversalAfterNormalize, 'safe.txt', invalid)).to.throw(Error);
    expect(() => FilesPath.visible(trailingTraversalAfterNormalize, 'safe.txt', invalid)).to.throw(
      Error,
    );
    expect(() => FilesPath.visible(nulAfterNormalize, 'safe.txt', invalid)).to.throw(Error);
  });

  it('freezes shared helper surfaces so callers cannot mutate path semantics', () => {
    const path = FilesPath.posix();

    expect(Object.isFrozen(FilesPath)).to.eql(true);
    expect(Object.isFrozen(FilesPath.Is)).to.eql(true);
    expect(Object.isFrozen(path)).to.eql(true);
    expect(Object.isFrozen(path.Is)).to.eql(true);
    expect(path.isAbsolute).to.equal(Path.Bounded.posix().isAbsolute);
    expect(() => {
      (path as { normalize: unknown }).normalize = () => '/outside';
    }).to.throw(TypeError);

    expect(FilesPath.visible(path, 'docs/readme.md', invalid)).to.eql('docs/readme.md');
  });

  it('provides deterministic POSIX path operations for structural backings', () => {
    const path = FilesPath.posix();

    expect(path.Is.absolute('/root')).to.eql(true);
    expect(path.Is.absolute('C:/root')).to.eql(true);
    expect(path.Is.absolute('docs/readme.md')).to.eql(false);
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
