import { Fs } from '@sys/fs';
import { displayPath, toolFailure } from '../source/u.result.ts';
import { ArchiveFixture, describe, expect, Is, it } from './common.ts';
import { context, rejection, withRoot } from './u.fixture.ts';
import { readTools } from './u.fixture.tools.ts';

// Direct owner tests cover registered tools, not provider serialization or a live Agent loop.
describe('Pi: ZIP runtime', () => {
  describe('inspection versus integrity', () => {
    it('registered tools → inspect metadata and test integrity without exposing payload bytes', async () => {
      await withRoot(async (root) => {
        const bytes =
          ArchiveFixture.zip([{ name: 'hello.txt', data: 'hello' }, { name: 'd/' }]).bytes;
        await Fs.write(Fs.join(root, 'a.zip'), bytes, { throw: true });
        const tools = await readTools(root);
        expect(tools.map((tool) => tool.name)).to.eql(['zip_inspect', 'zip_test']);
        expect(tools.map((tool) => tool.executionMode)).to.eql(['sequential', 'sequential']);
        const inspected = await tools[0].execute(
          'i',
          { path: 'a.zip' },
          undefined,
          undefined,
          context(root),
        );
        expect(inspected.content[0].type).to.eql('text');
        expect(inspected).not.to.have.property('isError');
        expect(inspected.details).to.include({
          kind: 'zip-inspection',
          format: 'zip32',
          fileCount: 1,
          directoryCount: 1,
          displayTruncated: false,
        });
        expect(Object.isFrozen(inspected.details)).to.eql(true);
        const tested = await tools[1].execute(
          't',
          { path: 'a.zip' },
          undefined,
          undefined,
          context(root),
        );
        expect(tested.details).to.include({
          kind: 'zip-integrity',
          filesTested: 1,
          expandedBytes: 5,
        });
        expect(tested.details).not.to.have.property('bytes');
        expect((await Fs.read(Fs.join(root, 'a.zip'))).data).to.eql(bytes);
        expect(await Fs.exists(Fs.join(root, 'hello.txt'))).to.eql(false);
      });
    });

    it('corrupt payload → inspection succeeds but integrity execution throws', async () => {
      await withRoot(async (root) => {
        await Fs.write(
          Fs.join(root, 'bad.zip'),
          ArchiveFixture.zip([{ name: 'a', data: 'hello', crc32: 0 }]).bytes,
          { throw: true },
        );
        const tools = await readTools(root);
        await tools[0].execute('i', { path: 'bad.zip' }, undefined, undefined, context(root));
        await rejection(
          () => tools[1].execute('t', { path: 'bad.zip' }, undefined, undefined, context(root)),
          'crc-mismatch',
        );
      });
    });
  });

  describe('refusal before source work', () => {
    it('pre-aborted signal → cancellation wins before missing-source I/O', async () => {
      const tools = await readTools();
      const controller = new AbortController();
      controller.abort();
      for (const tool of tools) {
        await rejection(
          () =>
            tool.execute('c', { path: 'absent.zip' }, controller.signal, undefined, context('/')),
          'operation cancelled',
        );
      }
    });

    it('reserved prefix → executing source adopts the shared guard before Snapshot', async () => {
      await withRoot(async (root) => {
        const path = '.sys.rooted-future/a.zip';
        await Fs.write(Fs.join(root, path), ArchiveFixture.zip().bytes, { throw: true });
        for (const tool of await readTools(root)) {
          await rejection(
            () => tool.execute('p', { path }, undefined, undefined, context(root)),
            'protected',
          );
        }
      });
    });
  });

  describe('bounded presentation', () => {
    it('large inspection → display is bounded, omitted count is exact, structured entries stay complete', async () => {
      await withRoot(async (root) => {
        const entries = Array.from(
          { length: 1_000 },
          (_, index) => ({ name: `file-${index}.txt` }),
        );
        await Fs.write(Fs.join(root, 'many.zip'), ArchiveFixture.zip(entries).bytes, {
          throw: true,
        });
        const [tool] = await readTools(root);
        const result = await tool.execute(
          'many',
          { path: 'many.zip' },
          undefined,
          undefined,
          context(root),
        );
        const content = result.content[0];
        if (content.type !== 'text' || !Is.record(result.details)) {
          throw new Error('Unexpected result.');
        }
        expect(content.text.length).to.be.at.most(60_000);
        expect(result.details.displayTruncated).to.eql(true);
        expect(Is.array(result.details.entries) && result.details.entries.length).to.eql(1_000);
        const shown = content.text.split('\n').filter((line) => /^\d+:/.test(line)).length;
        expect(content.text).to.include(`[display truncated: ${1_000 - shown} entries omitted]`);
        expect(Object.isFrozen(result.details.entries)).to.eql(true);

        expect(content.text).to.include('files=1000');
        expect(content.text).not.to.include('file-999.txt');
        expect(result.details.entries).to.satisfy((entries: unknown) =>
          Is.array(entries) &&
          entries.some((entry) => Is.record(entry) && entry.path === 'file-999.txt')
        );
      });
    });

    it('hostile errors → never invoke arbitrary message getters or admit reason-prefix lookalikes', () => {
      let reads = 0;
      const error = Object.defineProperty(new Error(), 'message', {
        get() {
          reads++;
          return 'source secret';
        },
      });
      const failure = toolFailure('zip_test', 'a\u001b.zip', error, 16_000);
      expect(reads).to.eql(0);
      expect(failure.message).to.include('unexpected bounded ZIP tool failure');
      expect(failure.message).not.to.include('\u001b');
      expect(failure.message).not.to.include('secret');
      expect(displayPath('\n\u202e')).not.to.include('\n');
    });
  });
});
