import {
  createRooted,
  DEFAULT_IO,
  describe,
  expect,
  expectFailure,
  Fs,
  it,
  setup,
  teardown,
  withIo,
} from './u.fixture.ts';
import { normalizeTargets } from '../u/u.target.ts';

describe('Fs.Capability.Rooted admission', () => {
  it('normalizes and freezes a complete portable target batch', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const admission = await rooted.admit([
        { kind: 'file', path: './docs//readme.md' },
        { kind: 'directory', path: 'generations/sha256-a' },
      ]);

      expect(admission.targets.map(({ kind, path }) => ({ kind, path }))).to.eql([
        { kind: 'file', path: 'docs/readme.md' },
        { kind: 'directory', path: 'generations/sha256-a' },
      ]);
      expect(Object.isFrozen(admission)).to.eql(true);
      expect(Object.isFrozen(admission.targets)).to.eql(true);
      expect(admission.targets.every(Object.isFrozen)).to.eql(true);
    } finally {
      await teardown(fixture);
    }
  });

  it('honors cancellation observed at the final admission IO boundary', async () => {
    const fixture = await setup();
    try {
      const controller = new AbortController();
      const io = withIo({
        lstat: async (path) => {
          if (Fs.basename(path) === 'final.txt') controller.abort('final-observation');
          return await DEFAULT_IO.lstat(path);
        },
      });
      const rooted = await createRooted({ root: fixture.root }, io);

      await expectFailure(
        () =>
          rooted.admit([{ kind: 'file', path: 'final.txt' }], {
            until: controller.signal,
          }),
        'cancelled',
      );
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects unsafe and non-portable target forms', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const invalid = [
        '',
        '/etc/passwd',
        'C:/Windows/system.ini',
        '../outside',
        'docs/../outside',
        'docs\\file.txt',
        'bad\0name',
        'CON',
        'con.txt',
        'LPT1.log',
        'trailing.',
        'trailing ',
        'bad:name',
        'bad*name',
        `bad${String.fromCharCode(1)}name`,
      ];

      for (const path of invalid) {
        await expectFailure(() => rooted.admit([{ kind: 'file', path }]), 'invalid-target');
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('reserves the canonical Rooted namespace case-insensitively', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const reserved = [
        '.sys.rooted',
        '.SYS.ROOTED/stages/x',
        '.sys.rooted-tmp-owned',
        '.sys.rooted-private',
      ];
      for (const path of reserved) {
        await expectFailure(() => rooted.admit([{ kind: 'file', path }]), 'invalid-target');
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('scales deterministic structural admission without quadratic ancestry scans', async () => {
    const many = Array.from({ length: 5_000 }, (_, index) => ({
      kind: 'file' as const,
      path: `assets/${index.toString().padStart(5, '0')}.js`,
    }));
    expect(normalizeTargets(many).length).to.eql(many.length);

    await expectFailure(
      () =>
        Promise.resolve(
          normalizeTargets([
            { kind: 'file', path: 'a' },
            { kind: 'directory', path: 'a-b' },
            { kind: 'file', path: 'a/child.js' },
          ]),
        ),
      'target-collision',
    );
  });

  it('rejects normalized duplicates and file-parent structural collisions', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });

      await expectFailure(
        () =>
          rooted.admit([
            { kind: 'file', path: './docs/a.txt' },
            { kind: 'file', path: 'docs//a.txt' },
          ]),
        'target-collision',
      );
      await expectFailure(
        () =>
          rooted.admit([
            { kind: 'file', path: 'pkg' },
            { kind: 'file', path: 'pkg/entry.js' },
          ]),
        'target-collision',
      );

      const allowed = await rooted.admit([
        { kind: 'directory', path: 'pkg' },
        { kind: 'file', path: 'pkg/entry.js' },
      ]);
      expect(allowed.targets.length).to.eql(2);
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects existing filesystem aliases by retained identity', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const canonical = Fs.join(fixture.root, 'canonical.txt');
      await Deno.writeTextFile(canonical, 'canonical');
      await Deno.link(canonical, Fs.join(fixture.root, 'hardlink.txt'));

      await expectFailure(
        () =>
          rooted.admit([
            { kind: 'file', path: 'canonical.txt' },
            { kind: 'file', path: 'hardlink.txt' },
          ]),
        'target-collision',
      );

      for (
        const alias of [
          ['case.txt', 'CASE.txt'],
          ['caf\u00e9.txt', 'cafe\u0301.txt'],
        ] as const
      ) {
        await Deno.writeTextFile(Fs.join(fixture.root, alias[0]), alias[0]);
        let sameIdentity = false;
        try {
          const selected = await Deno.lstat(Fs.join(fixture.root, alias[0]));
          const candidate = await Deno.lstat(Fs.join(fixture.root, alias[1]));
          sameIdentity = selected.dev === candidate.dev && selected.ino === candidate.ino;
        } catch (cause) {
          if (!(cause instanceof Deno.errors.NotFound)) throw cause;
        }
        if (sameIdentity) {
          await expectFailure(
            () =>
              rooted.admit([
                { kind: 'file', path: alias[0] },
                { kind: 'file', path: alias[1] },
              ]),
            'target-collision',
          );
        }
      }
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects replacement of the rooted directory identity', async () => {
    const fixture = await setup();
    try {
      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const moved = Fs.join(fixture.workspace, 'moved-root');
      await Deno.rename(fixture.root, moved);
      await Deno.mkdir(fixture.root);

      await expectFailure(
        () => rooted.admit([{ kind: 'file', path: 'file.txt' }]),
        'unsafe-filesystem',
      );
    } finally {
      await teardown(fixture);
    }
  });

  it('rejects observed root, ancestor, parent, and final-target symlinks', async () => {
    const fixture = await setup();
    try {
      await Deno.mkdir(fixture.root, { recursive: true });
      await Deno.mkdir(fixture.outside, { recursive: true });
      const linkedRoot = Fs.join(fixture.workspace, 'linked-root');
      await Deno.symlink(fixture.root, linkedRoot);
      await expectFailure(() => Fs.Capability.Rooted.create({ root: linkedRoot }), 'invalid-root');

      const rooted = await Fs.Capability.Rooted.create({ root: fixture.root });
      const dirLink = Fs.join(fixture.root, 'linked-dir');
      await Deno.symlink(fixture.outside, dirLink);
      await expectFailure(
        () => rooted.admit([{ kind: 'file', path: 'linked-dir/secret.txt' }]),
        'unsafe-filesystem',
      );

      const outsideFile = Fs.join(fixture.outside, 'secret.txt');
      await Deno.writeTextFile(outsideFile, 'secret');
      await Deno.symlink(outsideFile, Fs.join(fixture.root, 'linked-file'));
      await expectFailure(
        () => rooted.admit([{ kind: 'file', path: 'linked-file' }]),
        'unsafe-filesystem',
      );
    } finally {
      await teardown(fixture);
    }
  });
});
