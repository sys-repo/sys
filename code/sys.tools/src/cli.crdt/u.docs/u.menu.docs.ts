import { type t, c, Crdt } from '../common.ts';
import { YamlConfig } from '@sys/yaml/cli';
import { CrdtDocSchema } from './u.schema.ts';
import { CrdtDocsFs } from './u.fs.ts';

export type CrdtDocMenuPick =
  | { readonly kind: 'exit' }
  | { readonly kind: 'selected'; readonly path: t.StringFile; readonly doc: t.CrdtTool.DocumentYaml.Doc };

type Action = 'select';

export async function selectDocumentMenu(cwd: t.StringDir): Promise<CrdtDocMenuPick> {
  const schema = {
    init: () => CrdtDocSchema.initial(),
    validate: (value: unknown) => CrdtDocSchema.validate(value),
    stringifyYaml: (doc: t.CrdtTool.DocumentYaml.Doc) => CrdtDocSchema.stringify(doc),
  } as const;

  await CrdtDocsFs.ensureDir(cwd);
  const maxIdLen = await resolveMaxIdLen(cwd);

  const res = await YamlConfig.menu<t.CrdtTool.DocumentYaml.Doc, Action>({
    cwd,
    dir: CrdtDocsFs.dir,
    label: 'Documents',
    itemLabel: 'with',
    addLabel: 'add: <document>',
    indent: '  ',
    exitLabel: '← back',
    itemValue: ({ name, doc }) => {
      const id = String(doc?.id ?? name);
      const pad = ' '.repeat(Math.max(0, maxIdLen - id.length));
      const label = doc?.name ? ` ${c.gray('|')} ${doc.name}` : '';
      return `${id}${pad}${label}`;
    },
    ensureDefault: false,
    schema,
    mode: 'select',
    selectAction: 'select',
    invalid: { label: 'invalid yaml' },
    add: {
      message: 'Document ID',
      hint: 'CRDT id (no "crdt:" prefix)',
      validate(value) {
        const trimmed = String(value ?? '').trim();
        if (!trimmed) return 'Document ID required.';
        if (trimmed.startsWith('crdt:')) return 'Use the raw id (no crdt: prefix).';
        if (!Crdt.Is.id(trimmed)) return 'Invalid CRDT id.';
        return true;
      },
      initYaml: ({ name, doc }) => {
        const id = name.trim();
        const next = { ...doc, id } as t.CrdtTool.DocumentYaml.Doc;
        return CrdtDocSchema.stringify(next);
      },
    },
  });

  if (res.kind === 'exit') return { kind: 'exit' };
  if (res.kind !== 'action' || res.action !== 'select') return { kind: 'exit' };

  const checked = await CrdtDocsFs.readYaml(res.path);
  if (!checked.ok) {
    console.info(c.yellow('Document config is invalid. Use edit to fix.'));
    return { kind: 'exit' };
  }

  return { kind: 'selected', path: res.path, doc: checked.doc };
}

async function resolveMaxIdLen(cwd: t.StringDir): Promise<number> {
  const files = await CrdtDocsFs.list(cwd);
  let maxLen = 0;
  for (const path of files) {
    const checked = await CrdtDocsFs.readYaml(path);
    if (!checked.ok) continue;
    maxLen = Math.max(maxLen, String(checked.doc.id ?? '').length);
  }
  return maxLen;
}
