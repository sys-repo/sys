import { type t, Crdt, Obj, Yaml } from '../common.ts';
import { patch } from './m.patch.ts';

type O = Record<string, unknown>;

export async function swapoutRef(args: {
  cmd: t.Crdt.Cmd.Client;
  doc: t.Crdt.Id;
  from: t.Crdt.Id;
  to: t.Crdt.Id;
  path?: t.ObjectPath;
  dryRun?: boolean;
}) {
  const { cmd, doc, from, to, path = ['slug'], dryRun } = args;
  return await patch({ cmd, doc, path, dryRun }, (e) => {
    Yaml.walk(e.ast, (e) => {
      if (Yaml.Is.scalar(e.node)) {
        const from = Crdt.Id.clean(String(e.node.value)) ?? '';
        const to = Crdt.Id.clean(args.to);
        if (String(e.node.value).startsWith(Crdt.Id.toUri(from))) {
          if (to) {
            e.node.value = Crdt.Id.toUri(to);
          }
        }
      }
    });
  });
}
