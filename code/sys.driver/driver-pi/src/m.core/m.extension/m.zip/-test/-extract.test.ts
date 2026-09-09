import { Fs } from '@sys/fs';
import { FsCapability } from '@sys/fs/capability';
import { captureExtractPaths } from '../u/u.guard.ts';
import { ArchiveFixture, describe, expect, it, type t } from './common.ts';
import { withArchive } from './u.fixture.extract.ts';
import { context, failureText, rejection } from './u.fixture.ts';
import { extractTool, immediate } from './u.fixture.tools.ts';

describe('Pi: ZIP extraction', () => {
  it('cooperative opt-in → complete Rooted publication with separate cleanup truth', async () => {
    await withArchive(async (root) => {
      const tool = await extractTool(root);
      expect(tool.name).to.eql('zip_extract');
      expect(tool.executionMode).to.eql('sequential');
      const result = await tool.execute(
        'a',
        { path: 'a.zip', to: './unpacked' },
        undefined,
        undefined,
        context(root),
      );
      expect(result).not.to.have.property('isError');
      expect(result.details).to.include({
        kind: 'zip-extraction',
        publication: 'published',
        cleanup: 'complete',
      });
      expect((await Fs.readText(Fs.join(root, 'unpacked/deep/a.txt'))).data).to.eql('hello');
      expect((await Fs.readText(Fs.join(root, 'unpacked/empty'))).data).to.eql('');
      expect(Object.isFrozen(result.details)).to.eql(true);
    });
  });

  describe('integrity before construction', () => {
    it('corrupt input → no Rooted construction, stage, or destination', async () => {
      await withArchive(async (root) => {
        await Fs.write(
          Fs.join(root, 'a.zip'),
          ArchiveFixture.zip([{ name: 'a', data: 'bad', crc32: 0 }]).bytes,
          { throw: true },
        );
        let creates = 0;
        const rooted: t.FsRooted.Lib = {
          ...FsCapability.Rooted,
          create: (options) => {
            creates++;
            return FsCapability.Rooted.create(options);
          },
        };
        const tool = await extractTool(root, { rooted });
        await rejection(
          () =>
            tool.execute(
              'bad',
              { path: 'a.zip', to: './unpacked' },
              undefined,
              undefined,
              context(root),
            ),
          'crc-mismatch',
        );
        expect(creates).to.eql(0);
        expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
        expect(await Fs.exists(Fs.join(root, '.sys.rooted'))).to.eql(false);
      });
    });

    it('long admitted source → retains the failure code and includes source context only once', async () => {
      await withArchive(async (root) => {
        await Fs.write(
          Fs.join(root, 'bad.zip'),
          ArchiveFixture.zip([{ name: 'a', data: 'bad', crc32: 0 }]).bytes,
          { throw: true },
        );
        const requested = './'.repeat(2000) + 'bad.zip';
        const tool = await extractTool(root);
        const message = await failureText(() =>
          tool.execute(
            'long-path',
            { path: requested, to: 'unpacked' },
            undefined,
            undefined,
            context(root),
          )
        );
        expect(message).to.include('crc-mismatch');
        expect(message.length).to.be.at.most(16_000);
        expect(message.split(requested).length).to.eql(2);
        expect(await Fs.exists(Fs.join(root, 'unpacked'))).to.eql(false);
      });
    });
  });

  describe('destination admission', () => {
    it('existing, missing-parent, symlink, protected and operation roots → refuse before queuing', async () => {
      await withArchive(async (root) => {
        await Fs.ensureDir(Fs.join(root, 'existing'));
        await Fs.ensureSymlink(Fs.join(root, 'existing'), Fs.join(root, 'alias'));
        let queued = 0;
        const tool = await extractTool(root, {
          queue: (key, run) => {
            queued++;
            return immediate(key, run);
          },
        });
        for (
          const to of [
            'existing',
            'missing/child',
            'alias/child',
            '.git/new',
            '.PI/new',
            '.sys.rooted-new',
            './',
            '../outside',
          ]
        ) {
          await rejection(
            () => tool.execute('guard', { path: 'a.zip', to }, undefined, undefined, context(root)),
            'failed',
          );
        }
        expect(queued).to.eql(0);
      });
    });

    it('input traps → no getters or proxy traps and no extra parameters', () => {
      let reads = 0;
      for (
        const input of [
          {
            path: 'a.zip',
            get to() {
              reads++;
              return 'out';
            },
          },
          new Proxy({}, {
            ownKeys() {
              reads++;
              return [];
            },
          }),
          { path: 'a.zip', to: 'out', overwrite: true },
        ]
      ) expect(() => captureExtractPaths(input, 4096)).to.throw();
      expect(reads).to.eql(0);
    });
  });
});
