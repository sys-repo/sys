import { type t, Is, c, Str, Cli, D, Time, Yaml, Obj } from '../common.ts';
import { RepoProcess } from '../cmd.daemon.repo/mod.ts';
import { Fmt } from '../u.fmt.ts';

type O = Record<string, unknown>;

export async function startYamlViewer(dir: t.StringDir, doc: t.Crdt.Id, path?: t.ObjectPath) {
  const port = D.port.repo;
  const cmd = (await RepoProcess.tryClient(port))!;
  if (!cmd) return;

  const startedAt = Time.now.timestamp;
  const print = (current: O) => printScreen({ doc, current, path, startedAt });

  async function run(life: t.Lifecycle) {
    const current = (await cmd.send('doc:read', { doc })).value ?? {};
    print(current as O);

    /**
     * Lifecycle:
     */
    const shutdown = async () => {
      const spinner = Cli.spinner();
      spinner.start(Fmt.spinnerText('shutting down...'));
      spinner.stop();
    };

    life.dispose$.subscribe({ complete: shutdown });
  }

  // Wait here until (Ctrl-C).
  await Cli.keepAlive({
    onStart: async (life) => await run(life),
    exitCode: 0,
  });
}

function printScreen(args: {
  current: O;
  doc: t.Crdt.Id;
  startedAt: t.UnixTimestamp;
  path?: t.ObjectPath;
}) {
  const { current, path, startedAt } = args;
  const table = Cli.table();
  const uri = Fmt.prettyUri(args.doc);

  const kv = (label: string, value: string) => table.push([c.gray(' ' + label), value]);
  kv(c.white('Document:'), c.gray(uri));
  kv(' started:', c.gray(`${String(Time.elapsed(startedAt))} ago`));
  kv('    view:', 'yaml');

  // YAML extraction (raw)
  const lens = Obj.Lens.bind(current, path);
  const subject = lens.get();
  const yaml = Is.str(subject) ? subject : (Yaml.stringify(subject).data ?? '');

  // Terminal size
  const { width, height } = Cli.size();
  const maxWidth = Math.min(80, width);

  // Reserve rows for the table + breathing room
  const tableLines = String(table).split('\n').length;
  const reserved = tableLines + 6;
  const available = Math.max(1, height - reserved);

  // Truncate to fit terminal
  let lines = yaml.split(/\r?\n/);
  if (lines.length > available) {
    const visible = Math.max(1, available - 2); // leave space for: blank + msg
    const omittedChars = lines.slice(visible).join('\n').length.toLocaleString();
    const spacer = ''; // blank line
    const msg = c.gray(`... ${c.dim(c.italic(`${omittedChars} more chars`))}`);
    lines = [...lines.slice(0, visible), spacer, msg];
  }
  lines = lines.map((line) => line.slice(0, maxWidth));

  // Final output:
  const out = Str.builder();
  out.line(String(table));
  out.line();
  out.line(c.dim(c.gray('―'.repeat(maxWidth))));
  out.line(c.yellow(lines.join('\n')));
  out.line();
  out.line();
  out.line();

  console.clear();
  console.info(out.toString());
}
