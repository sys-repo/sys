import { type t, c, Cli, Crdt, Time } from './common.ts';

export async function promptForDocumentId() {
  const input = await Cli.Prompt.Input.prompt({ message: 'Enter document-id', maxLength: 28 });
  if (!Crdt.Is.id(input)) {
    const msg = `Invalid CRDT document-id (base62-28): ${c.gray(input)}`;
    console.info(c.yellow(msg));
    return promptForDocumentId();
  }
  return input;
}

export async function promptDocumentListSelection(doc: t.CrdtIndexDocRef) {
  const items = (doc.current.watching ?? []).sort((a, b) => a.addedAt - b.addedAt).toReversed();
  if (items.length === 0) return [];

  const options: { name: string; value: t.StringId }[] = items.map((item) => {
    const id = item.docid;
    const elapsed = Time.elapsed(item.addedAt);
    const ago = c.gray(`- added ${elapsed.toString()} ago`);
    return { name: `crdt:${id} ${ago}`, value: id };
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
