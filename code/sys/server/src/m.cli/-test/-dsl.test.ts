import { describe, expect, it } from '../../-test.ts';
import { ServerHelp } from '../../m.help/mod.ts';
import { stripAnsi } from '../common.ts';
import { ServerCli } from '../mod.ts';

describe('m.cli dsl', () => {
  it('dsl routes to root DSL help', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server dsl');
    expect(text).to.contain('Chapter');
    expect(text).to.contain('Reading protocol');
    expect(text).to.contain('Prompt asks for generic WebSocket command transport');
    expect(text).to.contain('websocket.cmd');
    expect(text).to.contain('files.websocket');
  });

  it('dsl websocket routes to the WebSocketServer chapter', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', 'websocket'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server dsl websocket');
    expect(text).to.contain('WebSocketServer');
    expect(text).to.contain('Deno.serve');
    expect(text).to.contain('Deno.upgradeWebSocket');
    expect(text).to.contain('WebSocketServer.start');
  });

  it('dsl files.websocket routes to the FilesServer WebSocket chapter', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', 'files.websocket'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server dsl files.websocket');
    expect(text).to.contain('FilesServer.WebSocket');
    expect(text).to.contain('FilesServer.WebSocket.start');
    expect(text).to.contain('Files.Client.websocket(url)');
    expect(text).to.contain('Golden path');
  });

  it('dsl websocket.cmd routes to the Cmd chapter', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', 'websocket.cmd'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server dsl websocket.cmd');
    expect(text).to.contain('nested `t.Cmd.*`');
    expect(text).to.contain('t.Cmd.Handler.Map');
  });

  it('dsl websocket.lifecycle routes to the lifecycle chapter', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', 'websocket.lifecycle'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server dsl websocket.lifecycle');
    expect(text).to.contain('close a WebSocket command server');
    expect(text).to.contain('server.server.shutdown()');
  });

  it('dsl websocket.service routes to the service chapter', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', 'websocket.service'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server dsl websocket.service');
    expect(text).to.contain('t.Service.Handle');
    expect(text).to.contain('Cell adapters own config loading');
  });

  it('dsl --format skill renders root skill Markdown', async () => {
    const root = await ServerHelp.Dsl.load();
    const res = await silent(() => ServerCli.run({ argv: ['dsl', '--format', 'skill'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(res.text).to.eql(text);
    expect(text).to.contain('---\nname: "sys-server-dsl"');
    expect(text).to.contain('description: "Guides @sys/server primitive boundaries');
    expect(text).to.contain(`# ${root.title}`);
  });

  it('dsl websocket.cmd --format skill renders chapter skill Markdown', async () => {
    const chapter = await ServerHelp.Dsl.load(['websocket.cmd']);
    const res = await silent(() =>
      ServerCli.run({ argv: ['dsl', 'websocket.cmd', '--format', 'skill'] })
    );
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(res.text).to.eql(text);
    expect(text).to.contain('name: "sys-server-dsl-websocket-cmd"');
    expect(text).to.contain(`# ${chapter.title}`);
    expect(text).to.contain('Cmd.Transport.fromWebSocket');
    expect(text).to.not.contain('@sys/server dsl websocket.cmd');
  });

  it('dsl --format human preserves human DSL help', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', '--format=human'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('help');
    expect(text).to.contain('@sys/server dsl');
    expect(text).to.contain('Chapter');
  });

  it('dsl --format unknown fails clearly with root DSL help', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', '--format', 'xml'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('Unsupported dsl format: xml (expected: human, skill)');
    expect(text).to.contain('@sys/server dsl');
    expect(text).to.contain('Reading protocol');
  });

  it('dsl --format without value fails clearly with root DSL help', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', '--format'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('Option requires a value: --format');
    expect(text).to.contain('@sys/server dsl');
  });

  it('dsl repeated --format fails clearly with root DSL help', async () => {
    const res = await silent(() =>
      ServerCli.run({ argv: ['dsl', '--format', 'human', '--format', 'skill'] })
    );
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('Repeated option for dsl: --format');
    expect(text).to.contain('@sys/server dsl');
  });

  it('dsl unknown fails with root DSL help', async () => {
    const res = await silent(() => ServerCli.run({ argv: ['dsl', 'missing'] }));
    const text = stripAnsi(res.text);

    expect(res.kind).to.eql('error');
    expect(text).to.contain('ServerHelp: DSL chapter not found: missing');
    expect(text).to.contain('@sys/server dsl');
    expect(text).to.contain('Chapter');
  });
});

async function silent<T>(fn: () => Promise<T>) {
  const info = console.info;
  console.info = () => undefined;

  try {
    return await fn();
  } finally {
    console.info = info;
  }
}
