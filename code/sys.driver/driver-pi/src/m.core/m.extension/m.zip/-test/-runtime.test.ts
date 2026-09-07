import type { ExtensionContext, ToolDefinition } from '@earendil-works/pi-coding-agent';
import { Fs } from '@sys/fs';
import { describe, expect, it } from '../../../../-test.ts';
import { zip } from '../../../../../../../sys/archive/src/m.Zip/-test/u.fixture.ts';
import { Is } from '../common.ts';
import { registerZipRead } from '../source/u.read.ts';
import { displayPath, toolFailure } from '../source/u.result.ts';
import { resolvePolicy } from '../u/u.policy.ts';

/** Direct owner tests cover registered tools, not provider serialization or a live Agent loop. */
describe('Pi: ZIP runtime', () => {
  it('registered tools → inspect metadata and test integrity without exposing payload bytes', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.zip.runtime.' })).absolute;
    try {
      const bytes = zip([{ name: 'hello.txt', data: 'hello' }, { name: 'd/' }]).bytes;
      await Fs.write(Fs.join(root, 'a.zip'), bytes, { throw: true });
      const tools = await registered(root);
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
    } finally {
      await Fs.remove(root);
    }
  });

  it('corrupt payload → inspection succeeds but integrity execution throws', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.zip.corrupt.' })).absolute;
    try {
      await Fs.write(
        Fs.join(root, 'bad.zip'),
        zip([{ name: 'a', data: 'hello', crc32: 0 }]).bytes,
        { throw: true },
      );
      const tools = await registered(root);
      await tools[0].execute('i', { path: 'bad.zip' }, undefined, undefined, context(root));
      await rejection(
        () => tools[1].execute('t', { path: 'bad.zip' }, undefined, undefined, context(root)),
        'crc-mismatch',
      );
    } finally {
      await Fs.remove(root);
    }
  });

  it('pre-aborted signal → cancellation wins before missing-source I/O', async () => {
    const tools = await registered();
    const controller = new AbortController();
    controller.abort();
    for (const tool of tools) {
      await rejection(
        () => tool.execute('c', { path: 'absent.zip' }, controller.signal, undefined, context('/')),
        'operation cancelled',
      );
    }
  });

  it('reserved prefix → executing source adopts the shared guard before Snapshot', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.zip.protected.' })).absolute;
    try {
      const path = '.sys.rooted-future/a.zip';
      await Fs.write(Fs.join(root, path), zip().bytes, { throw: true });
      for (const tool of await registered(root)) {
        await rejection(
          () => tool.execute('p', { path }, undefined, undefined, context(root)),
          'protected',
        );
      }
    } finally {
      await Fs.remove(root);
    }
  });

  it('large inspection → display is bounded, omitted count is exact, structured entries stay complete', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'pi.zip.display.' })).absolute;
    try {
      const entries = Array.from({ length: 1_000 }, (_, index) => ({ name: `file-${index}.txt` }));
      await Fs.write(Fs.join(root, 'many.zip'), zip(entries).bytes, { throw: true });
      const [tool] = await registered(root);
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
    } finally {
      await Fs.remove(root);
    }
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

async function registered(root?: string) {
  const tools: Pick<ToolDefinition, 'name' | 'executionMode' | 'execute'>[] = [];
  const policy = await resolvePolicy({ readRoots: root ? [root] : [], protectedRoots: [] });
  registerZipRead({
    registerTool(tool) {
      tools.push(tool);
    },
  }, policy);
  return tools;
}

/** A typed host fixture refuses every unused authority surface rather than inventing it. */
function context(cwd: string): ExtensionContext {
  const unused = (): never => {
    throw new Error('ZIP accessed an unused host capability.');
  };
  return {
    cwd,
    mode: 'tui',
    hasUI: false,
    model: undefined,
    scopedModels: [],
    signal: undefined,
    get ui() {
      return unused();
    },
    get sessionManager() {
      return unused();
    },
    get modelRegistry() {
      return unused();
    },
    isIdle: unused,
    isProjectTrusted: unused,
    abort: unused,
    hasPendingMessages: unused,
    shutdown: unused,
    getContextUsage: unused,
    compact: unused,
    getSystemPrompt: unused,
  };
}

async function rejection(run: () => Promise<unknown>, reason: string) {
  let rejected = false;
  try {
    await run();
  } catch (error) {
    rejected = true;
    if (!Is.error(error)) throw error;
    expect(error.message).to.include(reason);
    expect(error.message.length).to.be.at.most(16_000);
  }
  expect(rejected).to.eql(true);
}
