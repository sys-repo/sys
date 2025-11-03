import { type t, c, Cli, Crdt } from './common.ts';

/**
 * Textbox: "document-id"
 */
export async function promptForDocumentId(attempts = 0) {
  if (attempts > 2) return '';

  const input = await Cli.Prompt.Input.prompt({ message: 'Enter document-id' });
  let docid = (input ?? '').trim();
  docid = docid.replace(/^urn\:/, '').replace(/^crdt\:/, '');

  if (!Crdt.Is.id(docid)) {
    const msg = `Invalid CRDT document-id (base62-28): ${c.gray(docid || '<empty>')}`;
    console.info(c.yellow(msg));
    attempts++;
    return promptForDocumentId(attempts);
  }

  return docid;
}

/**
 * Textbox: display name
 */
export async function promptName() {
  const input = await Cli.Prompt.Input.prompt({ message: 'Enter display name' });
  let name = (input ?? '').trim();
  return name;
}

/**
 * Checkbox: select documents
 */
export async function promptDocumentListSelection(doc: t.CrdtIndexDocRef) {
  const items = (doc.current.watching ?? []).sort((a, b) => a.addedAt - b.addedAt).toReversed();
  if (items.length === 0) return [];

  const options: { name: string; value: t.StringId }[] = items.map((item) => {
    const id = item.docid;
    const name = item.name ? c.cyan(item.name) : '';
    return { name: `crdt:${id} ${name}`.trim(), value: id };
  });

  const selected =
    (await Cli.Prompt.Checkbox.prompt({
      message: 'Choose files',
      options,
      check: c.green('●'),
      uncheck: c.gray('○'),
    })) ?? [];

  return selected;
}
