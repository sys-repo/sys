import { describe, expect, it, type t } from '../../-test.ts';
import { Pkg } from '../../m.Pkg/mod.ts';

const hash = `sha256-${'a'.repeat(64)}`;
const claim = (size: number) => `${hash}:size=${size}`;
const limits: t.Pkg.Dist.Inventory.Limits = {
  entries: 100,
  fileBytes: Number.MAX_SAFE_INTEGER,
  totalBytes: Number.MAX_SAFE_INTEGER,
};
const inspect = (parts: unknown, bounds = limits) =>
  Pkg.Dist.Inventory.inspect({ parts, limits: bounds });

function inspected(parts: unknown, bounds = limits) {
  const result = inspect(parts, bounds);
  if (result.kind !== 'inspected') throw new Error(`Expected inspection: ${result.kind}`);
  return result;
}

describe('Pkg.Dist.Inventory', () => {
  it('literal shared prefixes → four entries, fourteen path units and five bytes', () => {
    const parts = { 'a/c.txt': claim(3), 'a/b.txt': claim(2) };
    const exact = {
      ...limits,
      entries: 4,
      pathLength: 7,
      pathTotal: 14,
      fileBytes: 3,
      totalBytes: 5,
    };
    const result = inspected(parts, exact);
    expect(result).to.eql({
      kind: 'inspected',
      files: [{ path: 'a/c.txt', hash, size: 3 }, { path: 'a/b.txt', hash, size: 2 }],
      totalBytes: 5,
      packageBytes: 0,
    });
    const budgets = [
      { ...exact, entries: 3 },
      { ...exact, pathLength: 6 },
      { ...exact, pathTotal: 13 },
      { ...exact, fileBytes: 2 },
      { ...exact, totalBytes: 4 },
    ];
    for (const bounds of budgets) expect(inspect(parts, bounds)).to.eql({ kind: 'limit-exceeded' });
    expect(Object.isFrozen(result)).to.eql(true);
    expect(Object.isFrozen(result.files)).to.eql(true);
    expect(result.files.every(Object.isFrozen)).to.eql(true);
    expect(Object.isFrozen(parts)).to.eql(false);
    parts['a/c.txt'] = claim(99);
    expect(result.files[0].size).to.eql(3);
    expect(Object.keys(result).sort()).to.eql(['files', 'kind', 'packageBytes', 'totalBytes']);
  });

  it('deep prefixes → nine charged units despite seven full-path units', () => {
    const parts = { 'a/b/c/d': claim(0) };
    const exact = { ...limits, entries: 5, pathLength: 7, pathTotal: 9 };
    expect(inspected(parts, exact).files).to.eql([{ path: 'a/b/c/d', hash, size: 0 }]);
    expect(inspect(parts, { ...exact, entries: 4 })).to.eql({ kind: 'limit-exceeded' });
    expect(inspect(parts, { ...exact, pathTotal: 8 })).to.eql({ kind: 'limit-exceeded' });
    // Repeated shared prefixes must be charged, not merely the unique directories.
    const shared = { 'a/b/c/d': claim(0), 'a/b/c/e': claim(0) };
    expect(inspected(shared, { ...exact, entries: 6, pathTotal: 18 }).files.length).to.eql(2);
    expect(inspect(shared, { ...exact, entries: 6, pathTotal: 17 }))
      .to.eql({ kind: 'limit-exceeded' });
  });

  it('UTF-16 paths → astral pairs count twice; malformed scalars refuse', () => {
    const parts = { 'a/🦊': claim(0) };
    const exact = { ...limits, entries: 3, pathLength: 4, pathTotal: 4 };
    expect(inspected(parts, exact).files[0].path).to.eql('a/🦊');
    expect(inspect(parts, { ...exact, pathLength: 3 })).to.eql({ kind: 'limit-exceeded' });
    expect(inspect(parts, { ...exact, pathTotal: 3 })).to.eql({ kind: 'limit-exceeded' });
    expect(inspect({ '\ud800': claim(0) })).to.eql({ kind: 'unsafe-path' });
  });

  it('package directories → byte classification, not metadata or a digest', () => {
    const result = inspected({ 'pkg/a': claim(2), 'a/pkg/b': claim(3), pkg: claim(7) });
    expect(result.totalBytes).to.eql(12);
    expect(result.packageBytes).to.eql(5);
  });

  it('selected own data → prototype-sensitive and null-prototype dictionary semantics', () => {
    const parts = Object.fromEntries([['__proto__', claim(1)], ['constructor', claim(2)]]);
    Object.defineProperty(parts, 'hidden', {
      get() {
        throw new Error('Hidden getter invoked.');
      },
    });
    Object.defineProperty(parts, Symbol.toStringTag, {
      get() {
        throw new Error('Tag invoked.');
      },
    });
    const result = inspected(parts);
    expect(result.files).to.eql([
      { path: '__proto__', hash, size: 1 },
      { path: 'constructor', hash, size: 2 },
    ]);
    const nullPrototype = Object.assign(Object.create(null), { a: claim(2) });
    // Author the own property explicitly rather than using object-literal __proto__ syntax.
    Object.defineProperty(nullPrototype, '__proto__', { value: claim(1), enumerable: true });
    expect(inspected(nullPrototype).totalBytes).to.eql(3);
    expect(Object.isFrozen(nullPrototype)).to.eql(false);
  });

  it('hostile parts and limits → refuse without proxy traps or accessor invocation', () => {
    let hooks = 0;
    const trap = (): never => {
      hooks++;
      throw new Error('Borrowed hook invoked.');
    };
    const handler = {
      get: trap,
      ownKeys: trap,
      getPrototypeOf: trap,
      getOwnPropertyDescriptor: trap,
    };
    const parts = { a: claim(0) };
    expect(inspect(new Proxy(parts, handler))).to.eql({ kind: 'malformed' });
    expect(inspect(Object.defineProperty({}, 'a', { enumerable: true, get: trap })))
      .to.eql({ kind: 'malformed' });
    const revoked = Proxy.revocable(parts, handler);
    revoked.revoke();
    expect(inspect(revoked.proxy)).to.eql({ kind: 'malformed' });
    expect(inspect(parts, new Proxy(limits, handler))).to.eql({ kind: 'invalid-input' });
    expect(inspect(parts, Object.defineProperty({ ...limits }, 'entries', { get: trap })))
      .to.eql({ kind: 'invalid-input' });
    expect(Pkg.Dist.Inventory.inspect(new Proxy({ parts, limits }, handler)))
      .to.eql({ kind: 'invalid-input' });
    expect(hooks).to.eql(0);
  });

  it('invalid limits → refuse before inventory work; unrelated fields stay unobserved', () => {
    let hooks = 0;
    const parts = new Proxy({}, {
      ownKeys() {
        hooks++;
        throw new Error('Inventory expanded.');
      },
    });
    const budgets = [
      { ...limits, entries: 0 },
      { ...limits, entries: NaN },
      { ...limits, fileBytes: -1 },
      { ...limits, totalBytes: Infinity },
      { ...limits, pathLength: 0 },
      { ...limits, pathTotal: 0 },
    ];
    for (const bounds of budgets) expect(inspect(parts, bounds)).to.eql({ kind: 'invalid-input' });
    const bounds = Object.defineProperty({ ...limits }, 'manifestBytes', {
      get() {
        hooks++;
        throw new Error('Unrelated limit observed.');
      },
    });
    expect(inspected({ a: claim(0) }, bounds).totalBytes).to.eql(0);
    expect(hooks).to.eql(0);
  });

  it('fixed ceilings → caller bounds cannot raise path or prefix work', () => {
    const raised = {
      ...limits,
      entries: Number.MAX_SAFE_INTEGER,
      pathLength: Number.MAX_SAFE_INTEGER,
      pathTotal: Number.MAX_SAFE_INTEGER,
    };
    expect(inspect({ ['x'.repeat(4097)]: claim(0) }, raised)).to.eql({ kind: 'limit-exceeded' });
    expect(inspected({ ['x'.repeat(4096)]: claim(0) }, raised).files.length).to.eql(1);
    const deep = `${'a/'.repeat(2047)}a`;
    expect(inspect({ [`${deep}x`]: claim(0), [`${deep}y`]: claim(0) }, raised))
      .to.eql({ kind: 'limit-exceeded' });
  });

  it('fixed entry ceiling → manifest plus 65,535 root files, never a raised caller cap', () => {
    const parts = Object.fromEntries(
      Array.from({ length: 65_535 }, (_, index) => [`f${index}`, claim(0)]),
    );
    const raised = { ...limits, entries: Number.MAX_SAFE_INTEGER };
    expect(inspected(parts, raised).files.length).to.eql(65_535);
    parts.extra = claim(0);
    const refused = inspect(parts, raised);
    expect(refused).to.eql({ kind: 'limit-exceeded' });
    expect(Object.isFrozen(refused)).to.eql(true);
  });

  it('empty or malformed claims → bounded parsing and safe-integer addition', () => {
    const malformed = [null, [], {}, { a: hash }, { a: `${hash}:size=01` }, { a: 'x'.repeat(94) }];
    for (const parts of malformed) expect(inspect(parts)).to.eql({ kind: 'malformed' });
    expect(inspected({ a: claim(Number.MAX_SAFE_INTEGER) }).totalBytes).to.eql(
      Number.MAX_SAFE_INTEGER,
    );
    expect(inspect({ a: claim(Number.MAX_SAFE_INTEGER), b: claim(1) }))
      .to.eql({ kind: 'limit-exceeded' });
    expect(inspect({ 'a/b/c/d': claim(0), z: 'bad' }, { ...limits, pathTotal: 8 }))
      .to.eql({ kind: 'malformed' });
  });

  it('inspection → no path-admission or verification authority', () => {
    for (const path of ['../a', 'a//b', 'dist.json', 'a/dist.json.sig']) {
      expect(inspected({ [path]: claim(0) }).files[0].path).to.eql(path);
    }
    expect(Object.keys(Pkg.Dist.Inventory)).to.eql(['inspect']);
    expect(Object.isFrozen(Pkg.Dist.Inventory)).to.eql(true);
  });
});
