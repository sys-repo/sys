import { describe, expect, it } from '../../-test.ts';
import { ServerHelp } from '../mod.ts';

describe('m.help', () => {
  it('freezes the public namespace graph', () => {
    expect(Object.isFrozen(ServerHelp)).to.eql(true);
    expect(Object.isFrozen(ServerHelp.Root)).to.eql(true);
    expect(Object.isFrozen(ServerHelp.Dsl)).to.eql(true);
  });

  it('loads root package help', async () => {
    const root = await ServerHelp.Root.load();

    expect(root.summary).to.contain('Server primitives for system packages.');
    expect(root.usage).to.eql([
      'deno run -ER jsr:@sys/server --help',
      'deno run -ER jsr:@sys/server dsl [chapter...] [--format human|skill]',
    ]);
    expect(root.commands).to.eql([
      [
        'dsl',
        'agent must read first — server primitive boundaries, speech acts, Cmd transport rules, Files WebSocket facade, lifecycle, and service contracts',
      ],
    ]);
    expect(root.options).to.eql([['-h, --help', 'show help']]);
  });

  it('loads the root DSL chapter with the locked chapter index', async () => {
    const root = await ServerHelp.Dsl.load();

    expect(root.path).to.eql([]);
    expect(root.id).to.eql('dsl');
    expect(root.chapters.map((chapter) => chapter.id)).to.eql([
      'websocket',
      'websocket.cmd',
      'websocket.lifecycle',
      'websocket.service',
      'files.websocket',
    ]);
    expect(root.sections.map((section) => section.label)).to.eql([
      'Reading protocol',
      'Rule',
      'Decision protocol',
      'Speech acts',
      'Mappings',
      'Command grammar',
      'Verification',
    ]);
  });

  it('loads WebSocketServer DSL chapters', async () => {
    const websocket = await ServerHelp.Dsl.load(['websocket']);
    const cmd = await ServerHelp.Dsl.load(['websocket.cmd']);
    const lifecycle = await ServerHelp.Dsl.load(['websocket.lifecycle']);
    const service = await ServerHelp.Dsl.load(['websocket.service']);
    const files = await ServerHelp.Dsl.load(['files.websocket']);

    expect(websocket.title).to.eql('WebSocketServer');
    expect(cmd.title).to.eql('WebSocketServer Cmd binding');
    expect(lifecycle.title).to.eql('WebSocketServer lifecycle');
    expect(service.title).to.eql('WebSocketServer service handle');
    expect(files.title).to.eql('FilesServer WebSocket facade');
  });

  it('fails clearly for unknown DSL chapters', async () => {
    const error = await catchError(() => ServerHelp.Dsl.load(['missing']));

    expect(error?.message).to.contain('ServerHelp: DSL chapter not found: missing');
  });
});

async function catchError(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (error) {
    if (error instanceof Error) return error;
    throw error;
  }
}
