import { type t, c, Obj, Try, Yaml } from '../common.ts';

type O = Record<string, unknown>;

export async function patch(
  args: {
    cmd: t.Crdt.Cmd.Client;
    doc: t.Crdt.Id;
    path: t.ObjectPath;
    dryRun?: boolean;
  },
  fn: (e: { ast: t.Yaml.Ast }) => void,
) {
  const { cmd, doc, path, dryRun = false } = args;
  const read = await cmd.send('doc:read', { doc });
  const lens = Obj.Lens.at<string>(path);
  const before = lens.get((read.value ?? {}) as O) ?? '';

  const ast = Yaml.parseAst(before);
  fn({ ast });

  try {
    String(ast);
  } catch (error) {
    console.log('doc', c.yellow(doc));
    console.log('error', error);
  }

  let parseFailed = false;
  let after = '';

  Try.run(() => (after = String(ast))).catch(() => {
    parseFailed = true;
    console.error(c.yellow(`Document contains errors: ${c.white(doc)}`));
  });

  const changed = before !== after;
  if (changed && !dryRun && !parseFailed) {
    await cmd.send('doc:write', { doc, value: after, path });
  }

  return {
    doc,
    changed,
    dryRun,
    parseFailed,
    get before() {
      return before;
    },
    get after() {
      return after;
    },
  } as const;
}
