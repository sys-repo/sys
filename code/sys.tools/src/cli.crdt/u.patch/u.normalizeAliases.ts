import { Is, type t, Yaml } from '../common.ts';
import { patch } from './m.patch.ts';

export async function normalizeAliases(args: {
  cmd: t.Crdt.Cmd.Client;
  doc: t.Crdt.Id;
  path?: t.ObjectPath;
  dryRun?: boolean;
}) {
  const { cmd, doc, path = ['slug'], dryRun } = args;
  return await patch({ cmd, doc, path, dryRun }, (e) => {
    Yaml.walk(e.ast, (event) => {
      const { path } = event;

      // We only care about entries whose parent key is "alias"
      if (path.length < 2) return;

      const parentKey = path[path.length - 2];
      const fieldKey = path[path.length - 1];

      if (parentKey !== 'alias') return;
      if (!Is.str(fieldKey) || !fieldKey.startsWith(':')) return;

      const node = event.node;
      if (!Yaml.Is.scalar(node)) return;

      const value = String(node.value ?? '');
      if (!value.startsWith('/')) return;

      // Remove exactly one leading slash
      node.value = value.slice(1);
    });
  });
}
