import { type t, c, Cli, Str, Time } from './common.ts';
import { promptDocumentListSelection, promptForDocumentId } from './u.prompt.ts';

/**
 * Add a document to the index.
 */
export async function addDoc(index: t.CrdtIndexDocRef) {
  const docid = await promptForDocumentId();

  const exists = (index.current.watching ?? []).some((m) => m.docid === docid);
  if (exists) {
    console.info(c.gray(`Already watching document: ${c.white(docid)}`));
    return;
  } else {
    index.change((d) => {
      const list = d.watching || (d.watching = []);
      list.push({ docid, addedAt: Time.now.timestamp });
    });
    console.info(c.gray(`Added document: ${c.white(docid)}`));
  }

  await list(index);
}

/**
 * Remove a document from the index.
 */
export async function removeDoc(index: t.CrdtIndexDocRef, repo: t.Crdt.Repo) {
  const ids = await promptDocumentListSelection(index);
  const remove = new Set(ids);
  index.change((d) => {
    const items = d.watching || (d.watching = []);
    if (!items.length || remove.size === 0) return;

    for (let i = items.length - 1; i >= 0; i--) {
      if (remove.has(items[i].docid)) items.splice(i, 1);
    }
  });

  const total = remove.size;
  console.info(c.gray(`Removed ${total} ${Str.plural(total, 'document', 'documents')}`));

  await list(index);
}

/**
 * List the documents:
 */
export async function list(index: t.CrdtIndexDocRef) {
  const items = (index.current.watching ?? []).sort((a, b) => a.addedAt - b.addedAt).toReversed();
  const table = Cli.table([]);

  if (items.length === 0) {
    console.info();
    return void console.info(c.gray(c.italic('  No documents are being watched')));
  }

  console.info(c.gray(`Watching:`));
  for (const item of items) {
    const docid = `${item.docid.slice(0, -5)}${c.green(item.docid.slice(-5))}`;
    const elapsed = Time.elapsed(item.addedAt);
    table.push([c.gray(` • crdt:${docid}`), c.gray(`added ${c.white(elapsed.toString())} ago`)]);
  }
  console.info(table.toString());
}
